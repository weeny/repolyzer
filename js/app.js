/* I am keeping DOM control in this file. */


var main=angular.module("repolyzer",[]);



main.controller("main",function($scope,$http,Github) {
  var params={};
  var cookies={};
  var GITHUB=Github.CONFIG;
  var GithubRepo=Github.GithubRepo;

  var access_token=null;
  var modal=angular.element(document.getElementById("authmodal"));

  //Get url parameters
  window.location.search.substr(1).split("&").map(function(param) {
    var kv=param.split("=");
    params[kv[0]]=decodeURIComponent(kv[1])
  });

  //Get cookie values
  document.cookie.split(";").map(function(param) {
    var kv=param.split("=");
    cookies[kv[0]]=kv[1];
  });

  if(params["access_token"]) {
    access_token=params["access_token"];

    // Set access token cookie
    document.cookie="access_token="+access_token;

    // The access token has been consumed, remove it from URL bar
    window.history.pushState({},"Authorized","/repolyzer/");

  } else if (cookies["access_token"]!=null) {
    // User prevously logged in
    access_token=cookies["access_token"];
  }

  if(access_token!=null) {
    GITHUB.access_token=access_token;
    modal.addClass("hidden");
  }


  $scope.auth=function() {
    // Send user to the github oauth login page
    window.location="https://github.com/login/oauth/authorize?client_id="+GITHUB.client_id
  }

  $scope.load=function load(repo) {
    if(repo!=undefined) $scope.projectname=repo;
    else repo=$scope.projectname;
    var Repo=null;
    if(repo in GITHUB.Repos) {
      for(var i=0;i<GITHUB.Repos.length;i++) {
        GITHUB.Repos[i].element.addClass("hidden");
      }

      Repo=GITHUB.Repos[repo];
      Repo.element.removeClass("hidden");
    } else {
      Repo=GITHUB.Repos[repo]=new GithubRepo(repo,this.access_token,this.URL);
      Repo.element=document.createElement("div");
      Repo.element.setAttribute("class","repo");
      document.getElementById("workspace").appendChild(Repo.element);

      // add hooks to place and update elements
      Repo.addFile=function addFile(f) {
        console.debug({adding:f});
        var file=document.createElement("div");
        file.innerHTML=f.filename;
        file.setAttribute("class","file");
        this.element.appendChild(file);
        file.size=f.additions;
        file.style.padding=(20+(f.size/20))+"px"

        return file;
      }
      Repo.updateFile=function updateFile(file,f) {
        file.size+=f.additions;
        file.size-=f.deletions;

        //file.style.padding=(20+(file.size/20))+"px"
      }
    }


    Repo.processcommits();

  };
});
