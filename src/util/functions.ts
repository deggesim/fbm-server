export const halfDownRound = (value: number) => {
    let half = value / 2;
    const decimalPart = half % 1;
    if (decimalPart === 0.5) {
        half -= decimalPart;
    } else {
        half = Math.round(half);
    }
    return half;
};
