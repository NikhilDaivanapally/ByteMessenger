function myThrottle(func, delay) {
  let timerFlag = null;

  return () => {
    if (timerFlag === null) {
      func();
      timerFlag = setTimeout(() => {
        timerFlag = null;
      }, delay);
    }
  };
}

export default myThrottle;