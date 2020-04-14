export const halfDownRound = (firstOperand: number, secondOperand: number) => {
    let half = firstOperand / secondOperand;
    const decimalPart = half % 1;
    if (decimalPart === 0.5) {
        half -= decimalPart;
    } else {
        half = Math.round(half);
    }
    return half;
};
