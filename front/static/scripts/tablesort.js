function table_sort() {
    $(document).ready(function() {
    $('#sortable').DataTable({
        destroy: true,
      "lengthMenu": [[10, 25, 50, -1], [10, 25, 50, "Все"]],
      "language": {
        "search": "Поиск:",
        "lengthMenu": "Показывать _MENU_ записей на странице",
        "info": "Показано с _START_ по _END_ из _TOTAL_ записей",
        "paginate": {
          "first": "Первая",
          "last": "Последняя",
          "next": "Следующая",
          "previous": "Предыдущая"
        },
        "dom": '<"top"i>rt<"bottom"flp><"clear">'
      }
    });
  });}

table_sort()
export { table_sort }