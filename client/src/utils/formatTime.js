const formatTime = (date) => {
  const Time = new Date(date).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Use 12-hour clock and show AM/PM
  });
  return { Time };
};

export default formatTime;
