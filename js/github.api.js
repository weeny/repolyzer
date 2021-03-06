main.service('Github', function($http,$timeout) {

  var CONFIG=this.CONFIG={
    URL:"https://api.github.com",
    client_id:"323583cb8f0f37957b7d",
    access_token:null,
    Users:{},
    Repos:{}
  };


  /*
  Githubrepo has the following hooks:

  addRepo - add the repo to the workspace

  addFile - add a new file to the workspace
  dropFile - remove a file from the workspace
  updateFile - update the parameters of the file in the workspace

  addCommit - add a new commit to the workspace


  It has the following events:
  stepforward - step forward 1 commit
  stepbackward - step backward 1 commit

  Files contains the html elements of all the files in the workspace

  The commits are indexed by sha and timestamp

  */


  function GithubRepo(reponame) {
    this.reponame=reponame;
  }

  //enumerable properties and indexes
  GithubRepo.prototype.reponame="";
  GithubRepo.prototype.Files={};
  GithubRepo.prototype.commits=[];
  GithubRepo.prototype.timestamps=[];
  GithubRepo.prototype.shas=[];
  GithubRepo.prototype.cursor=-1;
  GithubRepo.prototype.page=null;

  var odp=Object.defineProperty;
  GithubRepo.def=function(name,value) {
    odp(GithubRepo.prototype,name,value);
  }

  //non-enumerable properties, hooks, events, and methods
  GithubRepo.def("element",{value:null,writable:true});

  GithubRepo.def("update",{value:function(){},writable:true});
  GithubRepo.def("addFile",{value:function(){},writable:true});
  GithubRepo.def("dropFile",{value:function(){},writable:true});
  GithubRepo.def("newFile",{value:function(){},writable:true});

  GithubRepo.def("updateFile",{value:function(){},writable:true});
  GithubRepo.def("addCommit",{value:function(){},writable:true});

  GithubRepo.def("stepforward",{value:function(update) {
    if(this.cursor<this.commits.length-1) {
      this.cursor++;
      var githubrepo=this;
      var data=this.commits[this.cursor];

      //apply current commit
      var filenames=Object.keys(this.Files);
      for(var i=0;i<filenames.length;i++) {
        var filename=filenames[i];
        var F=this.Files[filename];
        F.age++;
      }
      if(update==undefined)
        this.update(1);
      for(var i=0;i<data.files.length;i++) {
        var f=data.files[i];

        //   $timeout(function() {
        if(f.filename in githubrepo.Files) {
          var F=githubrepo.Files[f.filename];
          if(f.status=="added") {
            githubrepo.addFile(F);
            if(f.size)
              F.size=f.size;
            F.prevage=F.age;
            F.age=0;
            F.exists=true;
          } else if (f.status=="modified") {

            //      F.size=F.size+f.additions-f.deletions;
            if(f.size)
              F.size=f.size;
            F.prevage=F.age;
            F.age=0;
            F.exists=true;
          } else {
            F.exists=false;
          }

          githubrepo.updateFile(F,f,data.html_url);

        }
      }
    }

  }});
  GithubRepo.def("stepbackward",{value:function() {
    //undo current commit
    var githubrepo=this;
    if(this.cursor>0) {
      //apply current commit
      //de-age all files
      var filenames=Object.keys(this.Files);
      for(var i=0;i<filenames.length;i++) {
        var filename=filenames[i];
        var F=this.Files[filename];
        F.age++;
      }
      this.update();

      for(var i=this.cursor;i>this.cursor-1;i--) {
        var data=this.commits[i];

        for(var i=0;i<data.files.length;i++) {
          var f=data.files[i];
          if(f.filename in githubrepo.Files) {
            var F=githubrepo.Files[f.filename];
            // F.size=F.size-f.additions+f.deletions;
            F.size=f.size;
            F.count=f.count;

            if(f.status=="deleted"||f.status=="removed") {
              F.age=0;
              this.addFile(F);
            }
            else if(f.status=="added") {
              this.dropFile(F);
            }

          }
        }
      }
      this.cursor-=2;

      this.stepforward();
    }

  }});

  GithubRepo.def("processcommit",{value:function processcommit(commitdata) {
    var githubrepo=this;
    var sha=commitdata.sha;
    var timestamp=commitdata.timestamp=Date.parse(commitdata.commit.author.date);
    if(!(sha in githubrepo.shas)) {

      var url=[CONFIG.URL,"repos",githubrepo.reponame,"commits",sha].join("/")
      url+="?r="+Math.random(10000);

      $http.get(url,{headers:{"Authorization":"token "+CONFIG.access_token}})
      .success(function (data,status,headers,config) {
        data.timestamp=commitdata.timestamp;

        for(var i=0;i<data.files.length;i++) {
          var f=data.files[i];

          if(f.filename in githubrepo.Files) {
            var File=githubrepo.Files[f.filename];

            f.size=File.size;
            if(f.status=="added") {
              File.size=f.size=File.size+f.additions-f.deletions;

              File.count=f.count=File.count+1;
              File.maxcount=File.count;

            } else if (f.status=="modified") {
              File.count++;
              f.count=File.count;
              File.maxcount=File.count;

              File.size=f.size=File.size+f.additions-f.deletions;
            } else {

              f.exists=false;
            }

          } else {

            f.age=0;
            f.size=f.additions;
            f.exists=true;
            var File=githubrepo.Files[f.filename]=githubrepo.newFile(f);
            githubrepo.addFile(File);
            File.size=f.size;
            File.count=f.count=1;
            File.maxcount=File.count;
          }


        }


        data.timestamp=commitdata.timestamp=timestamp;

        //   githubrepo.commits.push(data);
        //   githubrepo.timestamps.push(commitdata.author.date);
        //   githubrepo.shas.push(sha);
        var targetindex;

        var Commit=githubrepo.addCommit(commitdata);
        Commit.sha=commitdata.sha;

        Commit.date=timestamp;
        data.Commit=Commit;

        var placed=false;
        for(var i=0;i<githubrepo.timestamps.length;i++) {
          var ts = githubrepo.timestamps[i];
          if(timestamp<ts) {
            githubrepo.commits.splice(i,0,data);
            githubrepo.timestamps.splice(i,0,timestamp);
            githubrepo.shas.splice(i,0,sha);

            placed=true;break;
          }
        }
        if(!placed) {
          githubrepo.commits.push(data);
          githubrepo.timestamps.push(timestamp);
          githubrepo.shas.push(sha);

        }

        githubrepo.stepforward();

      }).error(function(data,status,headers,config) {
      });
    }

  }});
  GithubRepo.def("processcommits",{value:function processcommits(data,status,headers,config) {
    var url=null;
    var githubrepo=this;

    if (!(headers instanceof Function)) {
      // first callof processcommits
      githubrepo.page=null;
      url=[CONFIG.URL,"repos",this.reponame,"commits"].join("/");
    } else {
      headers=headers();
      if(headers.link) {
        /* this is a github querk.  Github api returns next=2 / last=1 when new page iminent.
        */
        var test=headers.link.match(/(\d+)>;\W*?rel="next".+?(\d+)>;\W*?rel="last"/)
        if(test!=null&&test[1]>test[2]) {
          githubrepo.page=1;
          url=null;
        } else {
          var prev=headers.link.match(/^.*<(.+?)>;\W*rel="prev"/);

          if(prev!=null) {
            // at last page or some page in middle
            githubrepo.page++;
            url=prev[1];

          } else {
            if(githubrepo.page==null) {
              //at first page, go to last page
              var last=headers.link.match(/^.*<(.+?)>;\W*?rel="last"/);
              githubrepo.page=0;
              if(last!=null) {
                url=last[1];
              } else {
                var next=headers.link.match(/^.*<(.+?)>;\W*?rel="next"/);
                url=next[1];
              }

            } else {
              // no more pages to load, leave url null, finalize callback
              url=null;
            }
          }
        }
      } else {
        // one-page listing, finalize callback
        githubrepo.page=1;
        url=null;
      }
    }



    if(url!=null) {
      $http.get(url,{headers:{"Authorization":"token "+CONFIG.access_token}})
      .success(function (data,status,headers,config) {
        githubrepo.processcommits(data,status,headers,config);

      }).error(function (data,status,headers,config) {
      });
    }
    if(githubrepo.page!=null&&githubrepo.page>0) {
      if(data instanceof Array) {
        for(var i=data.length-1;i>-1;i--) {
          //console.debug({id:githubrepo.cursor,date:data[i].commit.author.date,data:data[i]});

          githubrepo.processcommit(data[i]);

        }
      }
    }

  }});

  //export to angular
  this.GithubRepo=GithubRepo
});

