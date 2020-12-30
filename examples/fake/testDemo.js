function openUrl(fn){
    try {
        const url = fn();
        return url;
    } catch (e) {
        console.log(e);
    }
};

module.exports = {
    openUrl
}