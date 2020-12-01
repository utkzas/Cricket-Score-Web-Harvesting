
let request = require("request");
let path= require("path");
let xlsx=require("xlsx");
let cheerio = require("cheerio");
let fs = require("fs");

request("https://www.espncricinfo.com/scores/series/8048/season/2020/indian-premier-league?view=results", GetAMUrl);//get all match URL   
function GetAMUrl(err,resp, html){
    let sTool= cheerio.load(html);
    let allMatchUrlElem= sTool("a[data-hover='Scorecard']");
    for(let i = 0; i < allMatchUrlElem.length; i++){
        let href= sTool(allMatchUrlElem[i]).attr("href");
        let fUrl= "https://www.espncricinfo.com"+href;//to get complete link
        findDataOfAMatch(fUrl);
        console.log("#######################################################");
    }
}

function findDataOfAMatch(url){
    request(url, WhenDataArrive);
    function WhenDataArrive(err, resp, html){
        let sTool=cheerio.load(html);
        let tableElem = sTool("div.card.content-block.match-scorecard-table .Collapsible") ;//dono teams ka collapsible content
        console.log(tableElem.length);

        let count = 0;//to count number of players in a team
        for(let i = 0; i < tableElem.length; i++){//tableElem = 2 here. every collapsible area will be considered here
            //extracting and wrapping text
            //html => element html
             let teamName = sTool(tableElem[i]).find("h5.header-title.label").text();
            let rowsOfATeam = sTool(tableElem[i]).find(".table.batsman").find("tbody tr");
            let teamStrArr= teamName.split("Innings");
            teamName=teamStrArr[0].trim();
            for(let j = 0; j < rowsOfATeam.length; j++){
                let rCols = sTool(rowsOfATeam[j]).find("td");//to find number of columns of ith row
                let isBatsmanRow = sTool(rCols[0]).hasClass("batsman-cell");//to tell if this a batsman's row or empty row. every element having class "batsman-cell" will be considered
                if(isBatsmanRow == true){
                    count++;
                    let pName = sTool(rCols[0]).text().trim();
                    let runs = sTool(rCols[2]).text();
                    let balls = sTool(rCols[3]).text();
                    let fours = sTool(rCols[4]).text();
                    let sixes = sTool(rCols[5]).text();
                    let sr = sTool(rCols[6]).text();
                    console.log(`Name: ${pName} Runs: ${runs} Balls: ${balls} Fours:${fours} Sixes: ${sixes} Sr: ${sr}`);
               processplayer(teamName,pName,runs,balls,fours,sixes,sr);

                }
            
            }
            console.log("No. of batsman in team", count);
            console.log(".....................................................");
           
            console.log(teamName);
            count = 0;//now we'll count other team's no. of players
             
        }
    }
}
function processplayer(team,name,runs,balls,fours,sixes,sr)
{
    let dirPath=team;
    let pMatchStats={
        Team:team,
        Name:name,
        Balls:balls,
        Fours:fours,
        Sixes:sixes,
        Sr:sr,
        Runs:runs
    }
if (fs.existsSync(dirPath))
{
    //just a file check
}else{
    //create folder,file,add data
   fs.mkdirSync(dirPath);
}
let playerFilePath= path.join(dirPath,name+".xlsx");
let pData=[];
if(fs.existsSync(playerFilePath)){
    
 //pData=require(`./${playerFilePath}`);
 pData=excelReader(playerFilePath,name)
 pData.push(pMatchStats);
}else{
// create file
console.log("File of player",playerFilePath,"created");
pData=[pMatchStats];
}
excelWriter(playerFilePath,pData,name);
}

function excelReader(filepath,name)
{
    if(!fs.existsSync(filepath))
    return null;
    else
    { let wt=xlsx.readFile(filepath);
      let excelData=wt.Sheets[name];
      let ans=xlsx.utils.sheet_to_json(excelData);
      return ans;

    }
}

function excelWriter(filePath,json,name)
{
    newWB=xlsx.utils.book_new();
    let newWS = xlsx.utils.json_to_sheet(json);
    xlsx.utils.book_append_sheet(newWB,newWS,name);
    xlsx.writeFile(newWB,filePath);

}