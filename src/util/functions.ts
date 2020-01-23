export const halfDownRound = (value: number) => {
    let ret = value / 2;
    const decimalPart = value % 1;
    if (decimalPart === 0.5) {
        ret = value - decimalPart;
    } else {
        ret = Math.round(value);
    }
    console.log('ret', ret);
    return ret;
};
