function send_ajax_request(url, data, success_callback) {
    $.ajax({
        url: url,
        type: 'GET',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: success_callback,
        
    });
}