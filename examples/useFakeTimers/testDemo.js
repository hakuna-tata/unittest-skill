function intervalCutCount (start, end) {
   const countTimer = setInterval(function() {
        console.log(start);
        start += 1;
        if (start === end) {
            clearInterval(countTimer)
        }
   }, 1000)
}

function setTimeoutCutCount (start, end) {
    function loop() {
        console.log(start);
        start += 1;

        if (start <= end) {
            setTimeout(loop, 1000);
        }
    }

    loop();
}

module.exports = {
    intervalCutCount,
    setTimeoutCutCount
};
