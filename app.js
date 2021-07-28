// app.js
var express = require( 'express' );
var bodyParser = require( 'body-parser' );
var fs = require( 'fs' );
var uuid = require( 'uuid' );
var app = express();

var settings = require( './settings' );

//. https://www.npmjs.com/package/@cloudant/cloudant
var Cloudantlib = require( '@cloudant/cloudant' );

var db_url = '';
if( settings.db_name && settings.db_protocol && settings.db_host ){
  if( settings.db_username && settings.db_password ){
    db_url = settings.db_protocol + '://' + settings.db_username + ':' + settings.db_password + '@' + settings.db_host + '/';
    var cloudant = Cloudantlib( { account: settings.db_username, password: settings.db_password, url: db_url } );
    cloudant.db.get( settings.db_name, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name, function( err, body ){});
        }else{
        }
      }else{
      }
    });
  }else{
    db_url = settings.db_protocol + '://' + settings.db_host + '/';
    var cloudant = Cloudantlib( { url: db_url } );
    cloudant.db.get( settings.db_name, function( err, body ){
      if( err ){
        if( err.statusCode == 404 ){
          cloudant.db.create( settings.db_name, function( err, body ){});
        }else{
        }
      }else{
      }
    });
  }
}

app.use( express.static( __dirname + '/public' ) );
app.use( bodyParser.urlencoded( { extended: true, limit: '10mb' } ) );
app.use( bodyParser.json() );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );


app.get( '/', function( req, res ){
  res.render( 'index', { db_url: db_url + settings.db_name } );
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( 'server started on ' + port );
