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

  this.GithubRepo=function GithubRepo(reponame) {
    this.reponame=reponame;
    this.Files={};
    this.commits=[];
    this.timestamps=[];
    this.cursor=null;
    this.element=null;
    Object.defineProperty(this,"load",{value:function load(name) {
      var url=[CONFIG.URL,"repos",this.reponame,"commits"].join("/");

    }});
    Object.defineProperty(this,"processcommit",{value:function processcommit(commitdata) {
      var githubrepo=this;
      var sha=commitdata.sha;
      var url=[CONFIG.URL,"repos",githubrepo.reponame,"commits",sha].join("/")
      $http.get(url,{headers:{"Authorization":"token "+CONFIG.access_token}})
      .success(function (data,status,headers,config) {
        data.timestamp=commitdata.author.date;
        githubrepo.commits.push(data);
        githubrepo.timestamps.push(commitdata.author.date);

         for(var i=0;i<data.files.length;i++) {
          var f=data.files[i];
          if(f.filename in githubrepo.Files) {
            githubrepo.updateFile(githubrepo.Files[f.filename],f);
          } else {
            console.debug({adding2:f});
            githubrepo.Files[f.filename]=githubrepo.addFile(f);

          }
        }
        //console.debug({time:commitdata.author.date,file:data.files})
      }).error(function(data,status,headers,config) {
      });
    }});
    Object.defineProperty(this,"processcommits",{value:function processcommits(data,status,headers,config) {
      var url=null;
      var githubrepo=this;

      if (!(headers instanceof Function)) {
        // first callof processcommits
        url=[CONFIG.URL,"repos",this.reponame,"commits"].join("/");
      } else {
        headers=headers();
        if(headers.link) {
          var prev=headers.link.match(/^.*<(.+?)>;\W*rel="prev"/);

          if(prev!=null) {
            // at last page or some page in middle
            githubrepo.cursor++;
            url=prev[1];

          } else {
            if(githubrepo.cursor==null) {
              //at first page, go to last page
              var last=headers.link.match(/^.*<(.+?)>;\W*?rel="last"/);
              githubrepo.cursor=0;
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
          githubrepo.cursor=1;
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
      if(githubrepo.cursor!=null&&githubrepo.cursor>0) {
        if(data instanceof Array) {
          for(var i=data.length-1;i>=0;i--) {
            //console.debug({id:githubrepo.cursor,date:data[i].commit.author.date,data:data[i]});
            githubrepo.processcommit(data[i]);

          }
        }
      }

    }});
  }
});

