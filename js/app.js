/* I am keeping DOM control in this file. */


var main=angular.module("repolyzer",[]);



main.controller("main",function($scope,$http,$templateCache,$timeout,$compile,Github) {
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
    var repo=GITHUB.Repos[activerepo];
    repo.stepbackward();

    console.debug(repo.commits[repo.cursor]);
  }
  $scope.next=function next() {
    var repo=GITHUB.Repos[activerepo];

    repo.stepforward();

    console.debug(repo.commits[repo.cursor]);
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
      Repo.timeline=document.createElement("div");
      Repo.timeline.setAttribute("class", "timeline");
      Repo.element.appendChild(Repo.timeline);

      document.getElementById("workspace").appendChild(Repo.element);

      // add hooks to place and update elements

      //hook for before update to clear status classes and set age
      Repo.update=function(direction) {
        if(direction!==undefined) direction=1;
        console.debug({"updating:":this.Files});
        var filenames=Object.keys(this.Files);
        for(var j=0;j<filenames.length;j++) {
          var filename=filenames[j];
          var file=this.Files[filename];

          file.setAttribute("class","file")
          if(file.exists===false) file.setAttribute("class","file deleted");
          if(file.count===undefined||file.count==0) file.count=1;
          var agerate=file.age*100.0/file.maxcount;
          file.style.transform="translate3d(0,"+agerate+"px,-"+(file.age/2.0/file.maxcount)+"px)";
          //     file.style.margin="0 "+(file.age/5.0)+"%";
        }
      }
      Repo.addCommit=function addCommit(data) {
        /* I forgot how to use AngularJS' template system so you are treated to native JS. */
        var commit=document.createElement("div");
        commit.setAttribute("class","commit");
        var msg=document.createElement("span");
        msg.setAttribute("class","msg");
        msg.innerHTML=data.commit.message;
        var usr=document.createElement("span");
        usr.setAttribute("class","usr");
        usr.innerHTML=data.author.login;
        commit.appendChild(usr);
        commit.appendChild(msg);
        console.debug({commit:data});
        this.timeline.appendChild(commit);
      }
      Repo.addFile=function addFile(file) {
        if(file.size<300)
          file.style.height=(file.size)+"px";
        else
          file.style.height="300px";

        file.style.transform="translate3d(0,0,0)";

        file.setAttribute("class","file new");
        file.filesize.innerHTML=file.size;
        file.exists=true;
      };
      Repo.dropFile=function dropFile(file) {
        file.setAttribute("class","file deleted");
        file.exists=false;
      };
      Repo.newFile=function newFile(f) {
        /* I forgot how to use AngularJS' template system so you are treated to native JS. */

        var filenames=Object.keys(this.Files);
        var F,file;

        F=file;
        file=document.createElement("div");

        this.element.appendChild(file);
        file.filename=document.createElement("span");
        file.appendChild(file.filename);
        file.filename.setAttribute("class","filename");
        file.filesize=document.createElement("span");
        file.appendChild(file.filesize);
        file.filesize.setAttribute("class","filesize");
        file.filename.innerHTML=f.filename;
        file.filecount=document.createElement("span");
        file.appendChild(file.filecount);
        file.filecount.setAttribute("class","filesize");
        file.filecount.style.left="100%";


        return file;
      }
      Repo.updateFile=function updateFile(file,f) {
        file.filecount.innerHTML=f.count;

        file.age=0;
        // file.remove();
        file.style.transform="translate3d(0,0,0)";
        //// Repo.element.insertBefore(file,Repo.element.firstChild);
        // file.style.width=(file.size)+"px"
        if(file.size<300) {
          file.style.height=(file.size)+"px";
        }
        else {

          file.style.height=300+"px";

        }
        if(f.status=="deleted"||f.status=="removed") {
          file.setAttribute("class","file deleted");
          file.exists=false;
        } else if(f.status=="added") {
          file.setAttribute("class","file new");
          file.exists=true;
        } else {
          file.setAttribute("class","file updated")
          file.exists=true;
        }
        file.filesize.innerHTML=file.size;
        //file.style.padding=(20+(file.size/20))+"px"
      }
    }


    Repo.processcommits();

  };
});
