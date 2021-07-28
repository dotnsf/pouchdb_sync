
//. Local DBs
var local_db = null;
//. Remote DBs
var remote_db = null;

function init_sunhatoya( remote_db_url, updated_callback ){
  //. Local DBs
  local_db = new PouchDB( 'db' );

  //. Remote DBs
  remote_db = new PouchDB( remote_db_url );

  //. いったん local db をクリアして再作成する
  local_db.destroy().then( function( res1 ){
    //console.log( res1 );
    local_db = new PouchDB( 'db' );
    remote_db.sync( local_db, {
      live: true,
      retry: true
    }).on( 'paused', function( evt ){
      //. データ更新後、paused イベントが２度発生する？
      console.log( 'paused', evt ); //. undefined
      updated_callback(); //showRecords();
    });
  });
}
