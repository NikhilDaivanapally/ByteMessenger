const formatDate = (date) => {
  const FromatDate = new Date(Date.parse(date)).toDateString();
  return { FromatDate };
};
export default formatDate;
