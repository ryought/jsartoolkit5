
var Module;

if (typeof Module === 'undefined') Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

if (!Module.expectedDataFileDownloads) {
  Module.expectedDataFileDownloads = 0;
  Module.finishedDataFileDownloads = 0;
}
Module.expectedDataFileDownloads++;
(function() {
 var loadPackage = function(metadata) {

    var PACKAGE_PATH;
    if (typeof window === 'object') {
      PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
    } else if (typeof location !== 'undefined') {
      // worker
      PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
    } else {
      throw 'using preloaded data can only be done on a web page or in a web worker';
    }
    var PACKAGE_NAME = 'examples/patterns.data';
    var REMOTE_PACKAGE_BASE = 'patterns.data';
    if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
      Module['locateFile'] = Module['locateFilePackage'];
      Module.printErr('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
    }
    var REMOTE_PACKAGE_NAME = typeof Module['locateFile'] === 'function' ?
                              Module['locateFile'](REMOTE_PACKAGE_BASE) :
                              ((Module['filePackagePrefixURL'] || '') + REMOTE_PACKAGE_BASE);
  
    var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
    var PACKAGE_UUID = metadata.package_uuid;
  
    function fetchRemotePackage(packageName, packageSize, callback, errback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', packageName, true);
      xhr.responseType = 'arraybuffer';
      xhr.onprogress = function(event) {
        var url = packageName;
        var size = packageSize;
        if (event.total) size = event.total;
        if (event.loaded) {
          if (!xhr.addedTotal) {
            xhr.addedTotal = true;
            if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
            Module.dataFileDownloads[url] = {
              loaded: event.loaded,
              total: size
            };
          } else {
            Module.dataFileDownloads[url].loaded = event.loaded;
          }
          var total = 0;
          var loaded = 0;
          var num = 0;
          for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
            total += data.total;
            loaded += data.loaded;
            num++;
          }
          total = Math.ceil(total * Module.expectedDataFileDownloads/num);
          if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
        } else if (!Module.dataFileDownloads) {
          if (Module['setStatus']) Module['setStatus']('Downloading data...');
        }
      };
      xhr.onerror = function(event) {
        throw new Error("NetworkError for: " + packageName);
      }
      xhr.onload = function(event) {
        if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
          var packageData = xhr.response;
          callback(packageData);
        } else {
          throw new Error(xhr.statusText + " : " + xhr.responseURL);
        }
      };
      xhr.send(null);
    };

    function handleError(error) {
      console.error('package error:', error);
    };
  
      var fetchedCallback = null;
      var fetched = Module['getPreloadedPackage'] ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;

      if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);
    
  function runWithFS() {

    function assert(check, msg) {
      if (!check) throw msg + new Error().stack;
    }
Module['FS_createPath']('/', 'Pattern', true, true);

    function DataRequest(start, end, crunched, audio) {
      this.start = start;
      this.end = end;
      this.crunched = crunched;
      this.audio = audio;
    }
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.name = name;
        this.requests[name] = this;
        Module['addRunDependency']('fp ' + this.name);
      },
      send: function() {},
      onload: function() {
        var byteArray = this.byteArray.subarray(this.start, this.end);

          this.finish(byteArray);

      },
      finish: function(byteArray) {
        var that = this;

        Module['FS_createDataFile'](this.name, null, byteArray, true, true, true); // canOwn this data in the filesystem, it is a slide into the heap that will never change
        Module['removeRunDependency']('fp ' + that.name);

        this.requests[this.name] = null;
      }
    };

        var files = metadata.files;
        for (var i = 0; i < files.length; ++i) {
          new DataRequest(files[i].start, files[i].end, files[i].crunched, files[i].audio).open('GET', files[i].filename);
        }

  
    function processPackageData(arrayBuffer) {
      Module.finishedDataFileDownloads++;
      assert(arrayBuffer, 'Loading data file failed.');
      assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
      
        // copy the entire loaded file into a spot in the heap. Files will refer to slices in that. They cannot be freed though
        // (we may be allocating before malloc is ready, during startup).
        if (Module['SPLIT_MEMORY']) Module.printErr('warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting');
        var ptr = Module['getMemory'](byteArray.length);
        Module['HEAPU8'].set(byteArray, ptr);
        DataRequest.prototype.byteArray = Module['HEAPU8'].subarray(ptr, ptr+byteArray.length);
  
          var files = metadata.files;
          for (var i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }
              Module['removeRunDependency']('datafile_examples/patterns.data');

    };
    Module['addRunDependency']('datafile_examples/patterns.data');
  
    if (!Module.preloadResults) Module.preloadResults = {};
  
      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }
    
  }
  if (Module['calledRun']) {
    runWithFS();
  } else {
    if (!Module['preRun']) Module['preRun'] = [];
    Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
  }

 }
 loadPackage({"files": [{"audio": 0, "start": 0, "crunched": 0, "end": 6148, "filename": "/Pattern/.DS_Store"}, {"audio": 0, "start": 6148, "crunched": 0, "end": 6852, "filename": "/Pattern/1.fset"}, {"audio": 0, "start": 6852, "crunched": 0, "end": 108100, "filename": "/Pattern/1.fset3"}, {"audio": 0, "start": 108100, "crunched": 0, "end": 154555, "filename": "/Pattern/1.fset3.gz"}, {"audio": 0, "start": 154555, "crunched": 0, "end": 164117, "filename": "/Pattern/1.iset"}, {"audio": 0, "start": 164117, "crunched": 0, "end": 178616, "filename": "/Pattern/1.jpeg"}, {"audio": 0, "start": 178616, "crunched": 0, "end": 179940, "filename": "/Pattern/10.fset"}, {"audio": 0, "start": 179940, "crunched": 0, "end": 386260, "filename": "/Pattern/10.fset3"}, {"audio": 0, "start": 386260, "crunched": 0, "end": 412717, "filename": "/Pattern/10.iset"}, {"audio": 0, "start": 412717, "crunched": 0, "end": 507179, "filename": "/Pattern/10.jpg"}, {"audio": 0, "start": 507179, "crunched": 0, "end": 507383, "filename": "/Pattern/11.fset"}, {"audio": 0, "start": 507383, "crunched": 0, "end": 549891, "filename": "/Pattern/11.fset3"}, {"audio": 0, "start": 549891, "crunched": 0, "end": 556289, "filename": "/Pattern/11.iset"}, {"audio": 0, "start": 556289, "crunched": 0, "end": 572464, "filename": "/Pattern/11.jpg"}, {"audio": 0, "start": 572464, "crunched": 0, "end": 579376, "filename": "/Pattern/2.fset"}, {"audio": 0, "start": 579376, "crunched": 0, "end": 1086692, "filename": "/Pattern/2.fset3"}, {"audio": 0, "start": 1086692, "crunched": 0, "end": 1136434, "filename": "/Pattern/2.iset"}, {"audio": 0, "start": 1136434, "crunched": 0, "end": 1287844, "filename": "/Pattern/2.jpg"}, {"audio": 0, "start": 1287844, "crunched": 0, "end": 1289308, "filename": "/Pattern/3.fset"}, {"audio": 0, "start": 1289308, "crunched": 0, "end": 1508168, "filename": "/Pattern/3.fset3"}, {"audio": 0, "start": 1508168, "crunched": 0, "end": 1522564, "filename": "/Pattern/3.iset"}, {"audio": 0, "start": 1522564, "crunched": 0, "end": 1550922, "filename": "/Pattern/3.jpeg"}, {"audio": 0, "start": 1550922, "crunched": 0, "end": 1553386, "filename": "/Pattern/4.fset"}, {"audio": 0, "start": 1553386, "crunched": 0, "end": 1841414, "filename": "/Pattern/4.fset3"}, {"audio": 0, "start": 1841414, "crunched": 0, "end": 1865884, "filename": "/Pattern/4.iset"}, {"audio": 0, "start": 1865884, "crunched": 0, "end": 1948904, "filename": "/Pattern/4.jpg"}, {"audio": 0, "start": 1948904, "crunched": 0, "end": 1953488, "filename": "/Pattern/5.fset"}, {"audio": 0, "start": 1953488, "crunched": 0, "end": 2436612, "filename": "/Pattern/5.fset3"}, {"audio": 0, "start": 2436612, "crunched": 0, "end": 2498144, "filename": "/Pattern/5.iset"}, {"audio": 0, "start": 2498144, "crunched": 0, "end": 2625077, "filename": "/Pattern/5.jpg"}, {"audio": 0, "start": 2625077, "crunched": 0, "end": 2627269, "filename": "/Pattern/6.fset"}, {"audio": 0, "start": 2627269, "crunched": 0, "end": 2860685, "filename": "/Pattern/6.fset3"}, {"audio": 0, "start": 2860685, "crunched": 0, "end": 2887048, "filename": "/Pattern/6.iset"}, {"audio": 0, "start": 2887048, "crunched": 0, "end": 2961826, "filename": "/Pattern/6.jpg"}, {"audio": 0, "start": 2961826, "crunched": 0, "end": 2962618, "filename": "/Pattern/7.fset"}, {"audio": 0, "start": 2962618, "crunched": 0, "end": 3025826, "filename": "/Pattern/7.fset3"}, {"audio": 0, "start": 3025826, "crunched": 0, "end": 3036254, "filename": "/Pattern/7.iset"}, {"audio": 0, "start": 3036254, "crunched": 0, "end": 3081015, "filename": "/Pattern/7.jpg"}, {"audio": 0, "start": 3081015, "crunched": 0, "end": 3081547, "filename": "/Pattern/8.fset"}, {"audio": 0, "start": 3081547, "crunched": 0, "end": 3199667, "filename": "/Pattern/8.fset3"}, {"audio": 0, "start": 3199667, "crunched": 0, "end": 3220438, "filename": "/Pattern/8.iset"}, {"audio": 0, "start": 3220438, "crunched": 0, "end": 3277124, "filename": "/Pattern/8.jpg"}], "remote_package_size": 3277124, "package_uuid": "0ec3de9b-a9aa-401c-8a28-2609cdfc01e4"});

})();
