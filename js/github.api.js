main.service('Github', function($http) {

  var CONFIG=this.CONFIG={
    URL:"https://api.github.com",
    client_id:"323583cb8f0f37957b7d",
    access_token:null,
    Users:{},
    Repos:{}
  };

  /*  user:function user(username) {
    //commits takes repo in form owner/reponame
    var github=this;
    $http.get([this.URL,"users",username].join("/"))
    .success(function (data,status,headers,config) {
      console.debug(data);

    })
    .error(function (data,status,headers,config) {
      console.debug(data);
      console.debug(headers());

    });
  },
*/

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

  GithubRepo.def("addFile",{value:function(){},writable:true});
  GithubRepo.def("dropFile",{value:function(){},writable:true});
  GithubRepo.def("updateFile",{value:function(){},writable:true});
  GithubRepo.def("addCommit",{value:function(){},writable:true});

  GithubRepo.def("stepforward",{value:function() {
    this.cursor++;

    var data=this.commits[this.cursor];
    for(var i=0;i<data.files.length;i++) {
      var f=data.files[i];


      if(f.filename in this.Files) {
        var F=this.Files[f.filename];
        f.size+=f.additions;
        f.size-=f.deletions;
        f.count++;
        this.updateFile(this.Files[f.filename],f);
      } else {

        f.size=f.additions;
        f.count=1;
        this.Files[f.filename]=this.addFile(f);
      }
    }

  }});
  GithubRepo.def("stepbackward",{value:function() {
    this.cursor--;
  }});

  GithubRepo.def("processcommit",{value:function processcommit(commitdata) {
    var githubrepo=this;
    var sha=commitdata.sha;
    if(!(sha in githubrepo.shas)) {

      var url=[CONFIG.URL,"repos",githubrepo.reponame,"commits",sha].join("/")

      $http.get(url,{headers:{"Authorization":"token "+CONFIG.access_token}})
      .success(function (data,status,headers,config) {
        data.timestamp=commitdata.author.date;
        githubrepo.commits.push(data);
        githubrepo.timestamps.push(commitdata.author.date);
        githubrepo.shas.push(sha);
        githubrepo.addCommit(data);
        githubrepo.stepforward();
        //console.debug({time:commitdata.author.date,file:data.files})
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
            }

          } else {
            // no more pages to load, leave url null, finalize callback
            url=null;
          }
        }
      } else {
        // one-page listing, finalize callback
        githubrepo.page=1;
        url=null;
      }
    }



    if(url!=null) {
      console.debug({trying:url})
      $http.get(url,{headers:{"Authorization":"token "+CONFIG.access_token}})
      .success(function (data,status,headers,config) {
        githubrepo.processcommits(data,status,headers,config);
      }).error(function (data,status,headers,config) {
      });
    }
    if(githubrepo.page!=null&&githubrepo.page>0) {
      if(data instanceof Array) {
        for(var i=data.length-1;i>=0;i--) {
          //console.debug({id:githubrepo.cursor,date:data[i].commit.author.date,data:data[i]});
          githubrepo.processcommit(data[i]);

        }
      }
    }

  }});

  //export to angular
  this.GithubRepo=GithubRepo
});

