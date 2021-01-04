function cutCount (number) {
    setTimeout(() => {
        number--;
        console.log(number);
        if(number === 0) {
            return;
        }
    }, 1000);
}

module.exports = {
    cutCount
};
