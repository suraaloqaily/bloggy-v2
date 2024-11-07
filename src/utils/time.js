const handleTime = (date) => {
  const utcDate = new Date(date);

  const localDateTimeString = utcDate.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return localDateTimeString;
};
export default handleTime;
