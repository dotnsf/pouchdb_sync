exports.db_username = '';
exports.db_password = '';
exports.db_name = 'pouchdbsync';
exports.db_protocol = 'http';
exports.db_host = '';

if( process.env.VCAP_SERVICES ){
  var VCAP_SERVICES = JSON.parse( process.env.VCAP_SERVICES );
  if( VCAP_SERVICES && VCAP_SERVICES.cloudantNoSQLDB ){
    exports.db_username = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.username;
    exports.db_password = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.password;
    exports.db_protocol = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.protocol;
    exports.db_host = VCAP_SERVICES.cloudantNoSQLDB[0].credentials.host;
  }
}
