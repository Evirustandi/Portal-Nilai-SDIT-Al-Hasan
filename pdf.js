function downloadPDF() {
  const element = document.getElementById("hasil");

  html2pdf()
    .from(element)
    .save("raport.pdf");
}
