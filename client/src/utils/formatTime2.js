const formatTime2 = (date) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDate = new Date().getDate();

  const ProvidedYear = new Date(date).getFullYear();
  const ProvidedMonth = new Date(date).getMonth();
  const ProvidedDate = new Date(date).getDate();

  switch (true) {
    case currentYear === ProvidedYear &&
      currentMonth === ProvidedMonth &&
      currentDate === ProvidedDate:
      return "Today";
    case currentYear === ProvidedYear &&
      currentMonth === ProvidedMonth &&
      currentDate - 1 === ProvidedDate:
      return "Yesterday";

    default:
      return date;
  }
};
export default formatTime2;
