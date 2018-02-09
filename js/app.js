/* I am keeping DOM control in this file. */


var main=angular.module("repolyzer",[]);



main.controller("main",function($scope,$http,$templateCache,$compile,Github) {
  var params={};
  var cookies={};
  var GITHUB=Github.CONFIG;
  var GithubRepo=Github.GithubRepo;
  var activerepo="";

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

  $scope.prev=function prev() {
    GITHUB.Repos[activerepo].stepBackward();
  }
  $scope.next=function next() {
    GITHUB.Repos[activerepo].stepForward();
  }
  $scope.load=function load(repo) {
    if(repo!=undefined) $scope.projectname=repo;
    else repo=$scope.projectname;
    var Repo=null;
    activerepo=repo;
    var reponames=Object.keys(GITHUB.Repos)
    if(repo in GITHUB.Repos) {
      for(var i=0;i<reponames.length;i++) {
        GITHUB.Repos[reponames[i]].element.setAttribute("class","repo hidden");
      }

      Repo=GITHUB.Repos[repo];
      Repo.element.setAttribute("class","repo");
    } else {
      Repo=GITHUB.Repos[repo]=new GithubRepo(repo,this.access_token,this.URL);
      Repo.element=document.createElement("div");
      Repo.element.setAttribute("class","repo");
      document.getElementById("workspace").appendChild(Repo.element);

      // add hooks to place and update elements

      //hook for before update to clear status classes and set age
      Repo.update=function() {
        console.debug({"updating:":this.Files});
        var filenames=Object.keys(this.Files);
        for(var j=0;j<filenames.length;j++) {
          var filename=filenames[j];
          var file=this.Files[filename];
          file.setAttribute("class","file")
          file.style.transform="translate3d(0,-"+(file.age/2.0)+"px,-"+file.age+"px)";
         // file.style.margin=file.age+"em"
        }
      }
      Repo.addFile=function addFile(f) {
        console.debug({adding:f});
        var file=document.createElement("div");

        file.innerHTML=f.filename;
        file.setAttribute("class","file new");
        this.element.appendChild(file);
        file.style.padding=(20+(f.size/20))+"px"

        file.style.transform="translate3d(0,0,0)";
        return file;
      }
      Repo.updateFile=function updateFile(file,f) {

        file.age=0;
       // file.remove();
        file.style.transform="translate3d(0,0,0)";
       //// Repo.element.insertBefore(file,Repo.element.firstChild);
        file.style.width=(f.size)+"px"
        file.style.height=(f.size*0.5)+"px"
        if(f.status=="deleted"||f.status=="removed") {
          file.setAttribute("class","file deleted");
        } else if(f.status=="added") {
          file.setAttribute("class","file new");
        } else {
          file.setAttribute("class","file updated")
        }
        //file.style.padding=(20+(file.size/20))+"px"
      }
    }


    Repo.processcommits();

  };
});
