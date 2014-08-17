function purgetags() {
    mssql.query('delete from tags where id not in (select tagId from annotations)', {
        success: function () {
            console.log('successfully purged tags');
        },
        error: function (err) {
            console.log('failed to deleted tags ', err.toString());
        }
    });
}