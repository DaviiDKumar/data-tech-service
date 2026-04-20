export const exportToCSV = (data, fileName, headers) => {
  // 1. Headers set karo
  const csvRows = [headers.join(",")];

  // 2. Data rows set karo
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] || "";
      // Agar value mein comma hai toh use quotes mein dalo taaki CSV na tute
      return `"${val.toString().replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  // 3. Blob create karo
  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  // 4. Download link trigger karo
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};