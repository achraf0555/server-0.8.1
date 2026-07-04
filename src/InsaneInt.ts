export class InsaneInt {
	startingECount: number
	coefficient: number
	exponent: number

	constructor(startingECount: number, coefficient: number, exponent: number) {
		this.startingECount = startingECount
		this.coefficient = coefficient
		this.exponent = exponent
	}

	static fromString(val: string | InsaneInt) {
		if (val instanceof InsaneInt) {
			return new InsaneInt(val.startingECount, val.coefficient, val.exponent)
		}

		let rawValue = val
		let startingECount = 0
		while (rawValue.startsWith('e')) {
			startingECount += 1
			rawValue = rawValue.slice(1)
		}

		let coefficient: number
		let exponent: number

		if (rawValue.includes('e')) {
			if (rawValue.includes('#')) {
				const [rawCoefficient, rawECount] = rawValue.split('#')
				startingECount += Number(rawECount)
				rawValue = rawCoefficient
			}
			;[coefficient, exponent] = rawValue.split('e').map(Number)
		} else {
			coefficient = Number(rawValue)
			exponent = 0
		}

		return new InsaneInt(startingECount, coefficient, exponent)
	}

	toString() {
		let result = 'e'.repeat(this.startingECount)
		result += this.coefficient

		if (this.exponent !== 0) {
			result += `e${this.exponent}`
		}

		return result
	}

	greaterThan(other: InsaneInt) {
		// Balance first: comparison by startingECount/exponent/coefficient only
		// makes sense once both numbers are in canonical form.
		this.balance()
		other.balance()

		const mySign = Math.sign(this.coefficient)
		const otherSign = Math.sign(other.coefficient)

		// Different signs (or one is zero): sign alone decides it.
		if (mySign !== otherSign) {
			return mySign > otherSign
		}
		if (mySign === 0) {
			return false
		}

		// Same sign: compare magnitude the old way...
		let magnitudeCompare: number
		if (this.startingECount !== other.startingECount) {
			magnitudeCompare = this.startingECount - other.startingECount
		} else if (this.exponent !== other.exponent) {
			magnitudeCompare = this.exponent - other.exponent
		} else {
			magnitudeCompare = Math.abs(this.coefficient) - Math.abs(other.coefficient)
		}

		// ...but for two negative numbers, the one with the SMALLER magnitude
		// is the greater number (-5 > -10), so the comparison flips.
		return mySign > 0 ? magnitudeCompare > 0 : magnitudeCompare < 0
	}

	equalTo(other: InsaneInt) {
		return (
			this.startingECount === other.startingECount &&
			this.exponent === other.exponent &&
			this.coefficient === other.coefficient
		)
	}

	lessThan(other: InsaneInt) {
		return !this.equalTo(other) && !this.greaterThan(other)
	}

	isBalanced(): boolean {
		// Wrong 0s
		if (
			this.coefficient === 0 &&
			(this.exponent !== 0 || this.startingECount !== 0)
		) {
			return false
		}
		if (this.exponent === 0 && this.startingECount !== 0) {
			return false
		}

		// Improper balancing (checked on magnitude - sign doesn't affect
		// whether the coefficient/exponent split is in canonical range)
		const magnitude = Math.abs(this.coefficient)
		if ((magnitude >= 10 && this.exponent > 0) || magnitude >= 10000000) {
			return false
		}
		if (magnitude < 1 && this.exponent > 0) {
			return false
		}
		if (this.exponent >= 10000000) {
			return false
		}

		// Decimals in exponents, or leading zeros
		if (this.exponent % 1 !== 0 || this.startingECount % 1 !== 0) {
			return false
		}

		return true
	}

	balance() {
		let iterations = 0
		const MAX_BALANCE_ITERATIONS = 10000

		while (!this.isBalanced()) {
			iterations += 1
			if (iterations > MAX_BALANCE_ITERATIONS) {
				throw new Error(
					`InsaneInt.balance() failed to converge after ${MAX_BALANCE_ITERATIONS} iterations ` +
						`(startingECount=${this.startingECount}, coefficient=${this.coefficient}, exponent=${this.exponent}). ` +
						'This indicates a genuine normalization bug, not a slow-but-valid case - please report it.',
				)
			}

			if (this.coefficient === 0) {
				this.exponent = 0
				this.startingECount = 0
				return
			}

			// Ensure exponent is an integer
			if (this.startingECount > 0 && this.exponent % 1 !== 0) {
				const previousECount = this.startingECount
				this.startingECount = Math.max(this.startingECount - 1, 0)
				this.exponent *= 10 ** (previousECount - this.startingECount)
			}
			if (this.exponent % 1 !== 0) {
				this.coefficient *= 1 / (this.exponent % 1)
				this.exponent = Math.floor(this.exponent)
			}

			// Balance coefficient and exponent. All comparisons and the digit-count/
			// log10 math below operate on the magnitude - coefficient may be negative
			// (e.g. a negative score delta), and both Math.log10 and
			// Math.floor(x).toString().length behave incorrectly (NaN, or an extra
			// "-" character thrown into the digit count) if given a negative input
			// directly. Multiplying/dividing this.coefficient by a positive change
			// factor naturally preserves whatever sign it already had.
			let magnitude = Math.abs(this.coefficient)

			if ((magnitude >= 10 && this.exponent > 0) || magnitude >= 10000000) {
				const change = Math.floor(magnitude).toString().length - 1
				this.coefficient /= 10 ** change
				this.exponent += change
			}

			magnitude = Math.abs(this.coefficient)
			if (magnitude < 1 && this.exponent > 0) {
				let change = Math.ceil(Math.log10(1 / magnitude))
				if (change >= this.exponent) {
					change = this.exponent - 1
				}
				this.coefficient *= 10 ** change
				this.exponent -= change / 10 ** this.startingECount
			}

			// Balance exponent and startingECount
			if (
				(this.exponent >= 100000 && this.startingECount > 0) ||
				this.exponent >= 10000000
			) {
				const change = Math.floor(this.exponent).toString().length - 5
				this.exponent /= 10 ** change
				this.startingECount += change
			}
			if (
				this.exponent !== 0 &&
				this.exponent < 10000 &&
				this.startingECount !== 0
			) {
				let change = 5 - Math.floor(this.exponent).toString().length
				if (change >= this.startingECount) {
					change = this.startingECount - 1
				}
				this.exponent *= 10 ** change
				this.startingECount -= change
			}
		}
	}

	add(other: InsaneInt) {
		// Balance the numbers
		this.balance()
		other.balance()

		// Make the exponents the same
		let startingECount: number
		let coefficient: number
		let exponent: number

		const myStartingECount = this.startingECount
		const myCoefficient = this.coefficient
		let myExponent = this.exponent

		const otherStartingECount = other.startingECount
		const otherCoefficient = other.coefficient
		let otherExponent = other.exponent

		if (myStartingECount > otherStartingECount) {
			otherExponent /= 10 ** (myStartingECount - otherStartingECount)
			startingECount = myStartingECount
		} else if (myStartingECount < otherStartingECount) {
			myExponent /= 10 ** (otherStartingECount - myStartingECount)
			startingECount = otherStartingECount
		} else {
			startingECount = myStartingECount
		}

		if (myExponent > otherExponent) {
			coefficient =
				otherCoefficient / 10 ** (myExponent - otherExponent) + myCoefficient
			exponent = myExponent
		} else if (myExponent < otherExponent) {
			coefficient =
				myCoefficient / 10 ** (otherExponent - myExponent) + otherCoefficient
			exponent = otherExponent
		} else {
			coefficient = myCoefficient + otherCoefficient
			exponent = myExponent
		}

		const result = new InsaneInt(startingECount, coefficient, exponent)
		result.balance()
		return result
	}

	div(other: InsaneInt) {
		// Balance the numbers
		this.balance()
		other.balance()

		if (other.coefficient === 0) {
			return new InsaneInt(0, 0, 0)
		}

		let startingECount = this.startingECount
		const coefficient = this.coefficient / other.coefficient
		let exponent = this.exponent

		if (startingECount > other.startingECount) {
			exponent -= other.exponent / 10 ** (startingECount - other.startingECount)
			startingECount = this.startingECount
		} else if (startingECount < other.startingECount) {
			exponent =
				exponent / 10 ** (other.startingECount - startingECount) -
				other.exponent
			startingECount = other.startingECount
		} else {
			exponent -= other.exponent
		}

		const result = new InsaneInt(startingECount, coefficient, exponent)
		result.balance()
		return result
	}
}

const isFiniteInsaneInt = (value: InsaneInt) =>
	Number.isFinite(value.startingECount) &&
	Number.isFinite(value.coefficient) &&
	Number.isFinite(value.exponent)

export const parseFiniteInsaneInt = (value: string | InsaneInt) => {
	if (typeof value === 'string') {
		const trimmedValue = value.trim()
		if (trimmedValue.length === 0) {
			return null
		}

		const parsed = InsaneInt.fromString(trimmedValue)
		return isFiniteInsaneInt(parsed) ? parsed : null
	}

	const parsed = InsaneInt.fromString(value)
	return isFiniteInsaneInt(parsed) ? parsed : null
}
