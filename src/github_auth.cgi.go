package main

import (
  "fmt"
  "os"
  "net/url"
  //"time"
  "io/ioutil"
  "net/http/cgi"
  "net/http"
  "strings"
"encoding/json"

)

var client_id="323583cb8f0f37957b7d"
var client_secret="4eaa3b18a179fe0bcc4fe6f78358f3c7bd0c979e"
var github_access_token_url="https://github.com/login/oauth/access_token"
//var homepage="https://weeny.github.io/"
var homepage="http://fluffbase.com/repolyzer/"
func dump(err error) {
  if(err!=nil) {
    eo,_:=os.OpenFile(".err", os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0666)
    eo.WriteString(err.Error()+"\n")
    eo.Close()
  }
}

type AccessToken struct {
  AccessToken string `json:"access_token"`
  Bearer string `json:"bearer"`
  Scope string `json:"scope"`
}
func main() {
  //  publishableKey := os.Getenv("PUBLISHABLE_KEY")
  //stripe.Key = os.Getenv("SECRET_KEY")

  logue,err:=os.Create("log")
  dump(err)



  if err:= cgi.Serve(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    header:=w.Header()
    header.Set("Content-Type", "text/plain; charset=utf-8")
    query:=r.URL.Query()

    code:=""

    params:=make(map[string]string)


    for k:=range query {
      if k=="code" {
        code=query.Get(k)
      } else {
        params[k]=query.Get(k)
      }
    }



    if code!="" {

      client := &http.Client{}

      args:=url.Values{"client_id":{client_id,},"code":{code,},"client_secret":{client_secret,},}

      req,err:=http.NewRequest("POST",github_access_token_url,
                               strings.NewReader(args.Encode()))
      dump(err)
      req.Header.Add("Accept","application/json")

      resp,err:= client.Do(req)

      dump(err)

      var body []byte
      body,err=ioutil.ReadAll(resp.Body)
      response:=AccessToken{}
      err=json.Unmarshal(body,&response)
      dump(err)
      logue.Write(body)

      http.Redirect(w,r,fmt.Sprintf("%s?access_token=%s",homepage,response.AccessToken),302)

    } else {
      fmt.Fprintln(w,"No github auth code.")
    }
  })); err != nil {
    dump(err)
  }
  logue.Close()
}


