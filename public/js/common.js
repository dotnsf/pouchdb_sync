
var onProcess = false;  //. 二重処理防止用フラグ
function showRecords(){
  if( !onProcess ){
    onProcess = true;

    $('#records_tbody').html( '' );
    local_db.allDocs( { include_docs: true } ).then( function( docs ){
      if( docs && docs.rows ){
        var _docs = [];
        docs.rows.forEach( function( doc ){
          if( doc.id.indexOf( '_' ) !== 0 ){
            //console.log( doc.doc );
            _docs.push( doc.doc );
          }
        });

        //console.log( _docs );
        _docs = sortDocuments( _docs, 'updated' );

        //. table
        _docs.forEach( function( doc ){
          var tr = '<tr>'
            + '<td>' + hash4display( doc._id ) + '</td>'
            + '<td>' + doc.username + '</td>'
            + '<td>' + doc.body + '</td>'
            + '<td>' + timestamp2datetime( doc.updated ) + '</td>'
            + '<td>'
            + "<button class='btn btn-primary' title='edit' onClick='editRecord(" + JSON.stringify( doc ) + ")'><i class='fas fa-edit'></i> </button>"
            + "<button class='btn btn-success' data-toggle='modal' data-target='#myModal' title='revisions' onClick='showRevHistory(\"" + doc._id + "\")'><i class='far fa-copy'></i> </button>"
            + "<button class='btn btn-warning' title='delete' onClick='deleteRecord(\"" + doc._id + "\")'><i class='fas fa-trash-alt'></i> </button>"
            + '</td>'
            + '</tr>';
          $('#records_tbody').append( tr );
        });

        var tr0 = '<tr>'
          + '<td id="edit_id"></td>'
          + '<td><input type="text" id="edit_username" value=""/></td>'
          + '<td><input type="text" id="edit_body" value=""/></td>'
          + '<td> - '
          + '<input type="hidden" id="edit_rev" value=""/>'
          + '<input type="hidden" id="edit_created" value=""/>'
          + '<input type="hidden" id="edit_updated" value=""/>'
          + '</td>'
          + '<td>'
          + "<button class='btn btn-primary' title='update' onClick='updateRecord()'><i class='fas fa-save'></i> </button>"
          + '</td>'
          + '</tr>';
        $('#records_tbody').append( tr0 );
      }
      onProcess = false;
    }).catch( function( err ){
      onProcess = false;
      //console.log( 'local_db' );
      console.log( err );
    });
  }
}

function editRecord( doc ){
  $('#edit_id').html( doc._id );
  $('#edit_username').val( doc.username );
  $('#edit_body').val( doc.body );
  if( doc._rev ){ $('#edit_rev').val( doc._rev ); }else{ $('#edit_rev').val( '' ); }
  if( doc.created ){ $('#edit_created').val( doc.created ); }else{ $('#edit_created').val( '' ); }
  if( doc.updated ){ $('#edit_updated').val( doc.updated ); }else{ $('#edit_updated').val( '' ); }
}

function updateRecord(){
  var doc = {
    username: $('#edit_username').val(),
    body: $('#edit_body').val(),
    updated: ( new Date() ).getTime()
  };

  var _id = $('#edit_id').html();
  if( _id ){
    doc._id = _id;
    var _rev = $('#edit_rev').val();
    if( _rev ){ doc._rev = _rev; }
    var created = $('#edit_created').val();
    if( created ){ doc.created = parseInt( created ); }
  }else{
    doc._id = uuid.v1();
    doc.created = doc.updated;
  }

  //console.log( doc );
  local_db.put( doc ).then( function( result ){
    //. 同期イベントが発生するので、ここでは更新しない
    //showRecords();
  }).catch( function( err ){
    console.log( err );
  });
}

function deleteRecord( record_id ){
  if( record_id ){
    if( window.confirm( '指定レコードを削除します。よろしいですか？' ) ){
      local_db.get( record_id ).then( function( doc ){
        local_db.remove( doc, {}, function(){} );
        //. 同期イベントが発生するので、ここでは更新しない
        //showRecords();
      }).catch( function( err ){
        console.log( err );
      });
    }
  }
}

function reset(){
  if( window.confirm( '全レコードを削除します。よろしいですか？' ) ){
    local_db.allDocs( {} ).then( function( result ){
      if( result && result.rows ){
        var docs = [];
        result.rows.forEach( function( doc ){
          if( doc.id.indexOf( '_' ) !== 0 ){
            docs.push( { _id: doc.id, _rev: doc.value.rev, _deleted: true } );
          }
        });

        //console.log( JSON.stringify( docs, null, 2 ) );
        local_db.bulkDocs( docs );
      }
    }).catch( function( err ){
      console.log( err );
    });
  }
}

function showRevHistory( doc_id ){
  if( doc_id ){
    $('#rev_list').html( '' );
    getAllRevs( doc_id ).then( function( docs ){
      //console.log( docs );
      if( docs && docs.length ){
        docs.forEach( function( doc ){
          $('#rev_list').append( '<li class="list-group-item">' + JSON.stringify( doc, null, 2 ) + '</li>' );
        });
      }
    }).catch( function( err ){
      console.log( err );
    });
  }
}

//. https://stackoverflow.com/questions/4966427/getting-full-list-of-revisions-on-document-level-using-couchdb-python
function getAllRevs( doc_id ){
  return new Promise( function( resolve, reject ){
    var docs = [];
    local_db.get( doc_id, { revs_info: true }, function( err, body ){
      if( err ){
        reject( docs );
      }else{
        if( body._revs_info ){
          var _id = body._id;
          var cnt = 0;
          var len = body._revs_info.length;
          body._revs_info.forEach( function( rev_info ){
            //var status = rev_info.status;
            var _rev = rev_info.rev;
            local_db.get( _id, { include_docs: true, rev: _rev }, function( err, body ){
              cnt ++;
              if( err ){
              }else{
                //. 添付ファイル情報があったら、このタイミングで omit しておく？
                docs.push( body );
              }
              if( cnt == len ){
                resolve( docs );
              }
            });
          });
        }else{
          resolve( docs );
        }
      }
    });
  });
}

function sortDocuments( _docs, key, desc ){
  var docs = [];
  if( !key ){ key = 'created'; }
  for( var i = 0; i < _docs.length; i ++ ){
    var _doc = _docs[i];
    if( key in _doc ){
      var b = false;
      for( var j = 0; j < docs.length && !b; j ++ ){
        if( !desc && ( docs[j][key] > _doc[key] ) || desc && ( docs[j][key] < _doc[key] ) ){
          docs.splice( j, 0, _doc );
          b = true;
        }
      }
      if( !b ){
        docs.push( _doc );
      }
    }
  }

  return docs;
}

function sortTrs( _trs, idx, desc ){
  var trs = [];
  for( var i = 0; i < _trs.length; i ++ ){
    var _tr = _trs[i];
    var _td = _tr.cells[idx];
    var _v = ( idx == 3 ? _td.innerHTML : parseInt( _td.innerHTML ) );

    var b = false;
    for( var j = 0; j < trs.length && !b; j ++ ){
      var v = ( idx == 3 ? trs[j].cells[idx].innerHTML : parseInt( trs[j].cells[idx].innerHTML ) );
      if( !desc && ( v > _v ) || desc && ( v < _v ) ){
        trs.splice( j, 0, _tr );
        b = true;
      }
    }
    if( !b ){
      trs.push( _tr );
    }
  }

  return trs;
}

function timestamp2datetime( ts ){
  var dt = new Date( ts );
  var yyyy = dt.getFullYear();
  var mm = dt.getMonth() + 1;
  var dd = dt.getDate();
  var hh = dt.getHours();
  var nn = dt.getMinutes();
  var ss = dt.getSeconds();
  var datetime = yyyy + '-' + ( mm < 10 ? '0' : '' ) + mm + '-' + ( dd < 10 ? '0' : '' ) + dd
    + ' ' + ( hh < 10 ? '0' : '' ) + hh + ':' + ( nn < 10 ? '0' : '' ) + nn + ':' + ( ss < 10 ? '0' : '' ) + ss;
  return datetime;
}

function hash4display( hash ){
  var s = '';
  if( hash ){
    s = '<a href="#" title="' + hash + '">' + hash.substr( 0, 10 ) + '..</a>';
  }else{
    s = '' + hash;
  }

  return s;
}
