var http = require('http');
var fs = require('fs');
var mkdirp = require('mkdirp');


var SERVERS = ['a', 'b', 'c'];
var URL = 'tile.cloudmade.com';
var APIKEY = '8ee2a50541944fb9bcedded5165f09d9';
var STYLE = '998';
var RESOLUTION = '256';
var ZOOMLEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];
var XMAX = [1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535, 131071, 262143];
var YMAX = [1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535, 131071, 262143];

var SERVER_SWITCH_LEVEL = [2, 6, 22, 86, 342, 1366, 5462, 21846, 87382, 349526]

/*
##ZOOM##        ##GRID SIZE##           ##LIMIT##       ##TOTAL##               ##DISK SIZE##
1               2x2                     1               4                       92KB
2               4x4                     3               16                      192KB                      
3               8x8                     7               64                      588KB
4               16x16                   15              256                     1.62MB
5               32x32                   31              1,024                   7.26MB
6               64x64                   63              4,096                   22.6MB
7               128x128                 127             16,384                  91MB     
8               256x256                 255             65,536                              approx 229MB
9               512x512                 511             262,144                             approx 727MB                           
10              1024x1024               1023            1,048,576                           approx 2.28GB
11              2048x2048               2047            4,194,304                           approx 7.9GB
12              4096x4096               4095            16,777,216                          approx 23.3GB
13              8192x8192               8191            67,108,864                          approx 76.3GB
14              16384x16384             16383           268,435,456                         approx 246GB                   
15              32768x32768             32767           1,073,741,824                       approx 791GB                  
16              65536x65536             65535           4,294,967,296                       approx 2.5TB                     
17              131072*131072           131071          17,179,869,184                      approx 8 TB                  
18              262144*262144           262143          68,719,476,736                      approx 26TB                  

*/




var serverNum = 0;
var zoomNum = 5;
var streamCount = 0;

/*
var startX = 0;
var finishX = 0;
var startY = 0;
var finishY = 0;
*/

var count = 0;
var url;
var saveDir;
var fileName;
var dirExists;

var queue = [];
var urls = [];
var objects = [];




console.log('generating urls...');
for(x=0;x<=XMAX[zoomNum-1];x++){
    for(y=0;y<=YMAX[zoomNum-1];y++){
        
        if(count == SERVER_SWITCH_LEVEL[zoomNum-1]){
            serverNum++;
            count = 0;
        }
        
        count++;
        
        //make url and filesystem path
        fileName = y.toString() + '.png';
        url = 'http://' + SERVERS[serverNum] + '.' + URL + '/' + APIKEY + '/' + STYLE + '/' + RESOLUTION + '/' + ZOOMLEVELS[zoomNum-1] + '/' + x.toString() + '/' + fileName;
        saveDir = 'C:\\workspace\\cloudmade\\images\\' + STYLE + '\\' + RESOLUTION + '\\' + ZOOMLEVELS[zoomNum-1] + '\\' + x.toString() + "\\";
        
       
        //Check dir existence and potentially create.
        if(!fs.existsSync(saveDir)){
            mkdirp.sync(saveDir);
        }
        
        //Prevent stream overflow
        if(streamCount < 2000){
            
            
            
            var fileStream = fs.createWriteStream(saveDir + fileName);
            streamCount++;
            
            var newObject = makeObject(url, fileStream);
            objects.push(newObject);
            
        //save to queue until there are free streams
        } else {
            queue.push(saveDir + fileName);
            urls.push(url);
        }     
    }
}

console.log('getting files');


function makeObject(url, fileStream){
    
    
    //temp objects are made and pushed to an object array.  this is to avoid losing references to each individual url and filestream
    var newObject = {
        url:url,
        fileStream:fileStream,
        download:function(parent){
        
            //End of piping
            parent.fileStream.on('end', function(){
                parent.fileStream.end();
                streamCount--;
            });
        
            //Download file
            var request = http.get(parent.url, function(response){
                console.log("downloaded " + imgCount + " images")
                imgCount++;
                response.pipe(parent.fileStream);
                
               
                //Close open stream and open another
                if(queue.length > 0){
                    var fileStream = fs.createWriteStream(queue.shift());
                    
                    streamCount++;
                    
                    //console.log(objects.length);
                    
                    var newObject = makeObject(urls.shift(), fileStream);
                    objects.push(newObject);
                    
                    delete parent
            
                    
                }
                
                
                    
            });
        }
    }
    
    return newObject;
}


var imgCount = 0;
var total = Math.pow(Math.pow(2, zoomNum), 2)


getFiles();



function getFiles(){
    if(objects.length > 0){
        var object = objects.shift();
        object.download(object);
    }
    
    if(imgCount == total){
        //done
    } else {
        setImmediate(getFiles);
    }
    
    
}
    

