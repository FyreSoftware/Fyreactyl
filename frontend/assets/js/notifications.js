const elements = document.getElementById("notification_one");

if (!elements) {
} else {
  $("#notification-drop").on("click", () => {
    $("#notification_one").addClass("d-none");
  });
}
