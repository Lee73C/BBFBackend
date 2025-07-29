export const generateBarcode = () => {
    let barcode = '';
    for (let i = 0; i < 13; i++) {
        barcode += Math.floor(Math.random() * 10);
    }
    return barcode;
}