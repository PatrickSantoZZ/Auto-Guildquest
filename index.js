'use strict'
String.prototype.clr = function (hexColor) { return `<font color='#${hexColor}'>${this}</font>` };
 const fs = require('fs'),
	   path = require('path'),		
       Quests = require("./quests.json");

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));
if (!settings.enabled) return;

module.exports = function AutoGuildquest(mod) {
	const { command } = mod.require;


	let myQuestId = 0,
		status = 2,
		progress = 0,
		clr = 0,
		entered = false,
		hold = false,
		daily = 0,
		weekly = 0,
		niceName = mod.proxyAuthor !== 'caali' ? '[VG] ' : ''
	  
	mod.hook('S_LOAD_TOPO',3, (event) => {
		if (settings.battleground.includes(event.zone)) {
			hold = true
		} else if (hold && myQuestId !== 0) {
			hold = false
			completeQuest()
			dailycredit()
			CompleteExtra()
		}
	});

//Hook
	mod.hook('S_LOGIN', 'raw', () => {daily = 0 , weekly = 0})
	mod.hookOnce('S_AVAILABLE_EVENT_MATCHING_LIST', 1, event => {daily = event.unk4weekly = event.unk6})
	mod.hook('S_LOGIN', 'raw', () => {mod.hookOnce('S_SPAWN_ME', 'raw', () => {setTimeout(dailycredit,1000+ Math.random()*250);});});
	mod.hook('S_FIELD_EVENT_ON_ENTER', 'raw', () => {  entered = true;});
	mod.hook('C_RETURN_TO_LOBBY', 'raw', () => {  entered = false;});
	mod.hook('S_COMPLETE_EVENT_MATCHING_QUEST', 1, (event) => {
		daily++
		weekly++
		if (settings.Vanguard) {
			myQuestId = event.id
			if (!hold) setTimeout(completeQuest,1000+ Math.random()*250);
		}
	});
	mod.hook('S_FIELD_EVENT_PROGRESS_INFO', 1, () => {if (settings.Guardian) setTimeout(completeGuardian, 2000+ Math.random()*250);});
	mod.hook('S_UPDATE_GUILD_QUEST_STATUS', 1, (event) => {
		if (settings.GQuest) {
			if (event.targets[0].completed == event.targets[0].total) {
				setTimeout(()=>{
				mod.send('C_REQUEST_FINISH_GUILD_QUEST', 1, {quest: event.quest})
				}, 2000 + Math.random()*1000)
				setTimeout(() => {
				mod.send('C_REQUEST_START_GUILD_QUEST', 1, {questId: event.quest})
				}, 4000 + Math.random()*1000)
			}
		}
	})
	mod.hook('S_FIELD_POINT_INFO', 2, (event) => {       
		if(entered && event.cleared != clr && event.cleared - 1 > event.claimed){
			mod.toClient('S_CHAT', 3, {
			channel: 21,
			gm: 1,
			name: 'Guardian Mission',
			message: String(event.cleared + " / 40")
			});}clr = event.cleared;});
	 mod.hook("S_GUILD_QUEST_LIST", 2, (event) => {
		if (settings.GQuestLog) {
			GetQuestsInfo(event["quests"]);
		}
	})

//Function
	function completeQuest() {
		mod.send('C_COMPLETE_DAILY_EVENT', 1, {id: myQuestId})	
		setTimeout(() => {mod.send('C_COMPLETE_EXTRA_EVENT', 1, {type: 0})
		}, 500+ Math.random()*250)
		setTimeout(() => {mod.send('C_COMPLETE_EXTRA_EVENT', 1, {type: 1})
		}, 1000+ Math.random()*250)
		myQuestId = 0
		if(settings.VLog) report() 
		
	}; 
	function report() {
		if(daily < 16) sendMessage(niceName + 'Daily Vanguard Requests completed: ' + daily)
		else sendMessage(niceName + 'You have completed all 16 Vanguard Requests today.')
	}
	function completeGuardian() {
		mod.send('C_REQUEST_FIELD_POINT_REWARD', 1, {})
		setTimeout(() => {
		mod.send('C_REQUEST_ONGOING_FIELD_EVENT_LIST', 1, {})
	}, 2000+ Math.random()*500)
};
	function dailycredit() {
		if (settings.Daily) {
			let _ = mod.send('C_REQUEST_RECV_DAILY_TOKEN', 1, {});
			 !_ ? sendMessage('Unmapped protocol packet \<C_REQUEST_RECV_DAILY_TOKEN\>.') : null;
		  }
	};
	function GetQuestsInfo(questEvent) {
		for (let questIndex in questEvent) {
			if ([1, 2].includes(questEvent[questIndex]["status"])) {
				let qName = questEvent[questIndex]["name"].replace("@GuildQuest:", "");
				let qSize = GetQuestSize(questEvent[questIndex]["size"]);
				let qStatus = `${questEvent[questIndex]["status"] == 1 ? "[ACTIVE]".clr("f1ef48") : "[COMPLETE]".clr("3fce29")}`;
				let qTime = new Date(1000 * questEvent[questIndex]["timeRemaining"]).toISOString().substr(11, 8);
				sendMessage(`${qStatus} ${Quests[qName].clr("0cccd6")} ${qSize.clr("0c95d4")} Time left: ${qTime.clr("db3dce")}`)
		} else {continue}}}

	function GetQuestSize(size) {
		if (size == 0) {
			return "(Small)"
		} else if (size == 1) {
			return "(Medium)"
		} else {
			return "(Large)"
		}
	}

	function sendMessage(msg) { 
		if(settings.CLI){ mod.log(msg) }
		else { command.message(msg) }
}

//Command
	command.add('auto', {
		'AC': () =>{
		   settings.enabled = !settings.enabled
		   sendMessage("AutoQuests-Mod is now : " + (settings.enabled ? "On" : "Off"));
		},
		'VG': () => {
			settings.Vanguard = !settings.Vanguard
			sendMessage("Auto-Vanguardquest: " + (settings.Vanguard ? "On" : "Off"));
		},
		'GQ': () => {
			settings.GQuest = !settings.GQuest
			sendMessage("Auto-Guildquest: " + (settings.GQuest ? "On" : "Off"));
		},
		'GL': () => {
			settings.Guardian = !settings.Guardian
			sendMessage("Auto-Guardian-Legion: " + (settings.Guardian ? "On" : "Off"));
		},
		'DC': () => {
			settings.Daily = !settings.Daily
			sendMessage("Auto-Daily-Credit: " + (settings.Daily ? "On" : "Off"));
		},
		'VGLog': () => {
			settings.VLog = !settings.VLog
			sendMessage("Vanguard-Quest Logger: " + (settings.VLog ? "On" : "Off"));
		},
		'CLI': () => {
			settings.CLI = !settings.CLI
			sendMessage("CLI is now " + (settings.CLI ? "On" : "Off"));
		},
		'$default': () => {
			sendMessage(`Invalid argument. usasge command with 'auto'`),
			sendMessage(`VQ | Auto-Vanguard`),
			sendMessage(`GQ | Auto-GuildQuest with relaunch`),
			sendMessage(`VGLog |Vanguard-Quest-Logger`),
			sendMessage(`GL |Auto claim box in Guardian legion`),
			sendMessage(`DL |Auto claim Daily credits`);
			sendMessage(`CLI | activated/deactivated Clientless mode`)
		}
	});
	}


	


