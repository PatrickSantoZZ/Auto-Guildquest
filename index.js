module.exports = function AutoGuildquest(mod) {

	let myQuestId = 0,
		status = 2,
		progress = 0,
		clr = 0,
		entered = false,
		hold = false;

		mod.command.add('auto', {
			'VG': () => {
				mod.settings.Vanguard = !mod.settings.Vanguard
				sendMessage("Auto-Vanguardquest: " + (mod.settings.Vanguard ? "On" : "Off"));
			},
			'GQ': () => {
				mod.settings.GQuest = !mod.settings.GQuest
				sendMessage("Auto-Guildquest: " + (mod.settings.GQuest ? "On" : "Off"));
			},
			'RL': () => {
				mod.settings.auto = !mod.settings.auto
				sendMessage("Auto-Relaunch-Guildquest: " + (mod.settings.auto ? "On" : "Off"));
			},
			'GL': () => {
				mod.settings.Guardian = !mod.settings.Guardian
				sendMessage("Auto-Gardian-Legion: " + (mod.settings.Guardian ? "On" : "Off"));
			  },
			'DC': () => {
				mod.settings.Daily = !mod.settings.Daily
				sendMessage("Auto-Daily-Credit: " + (mod.settings.Daily ? "On" : "Off"));
			  },
			'$default': () => {
				sendMessage(`Invalid argument. uasge : auto [VG|GQ|RL|GL|DC]`);
			}
		  });
	  
	mod.game.me.on('change_zone', (zone, quick) => {
		if (mod.settings.battleground.includes(zone)) {
			hold = true
		} else if (hold && myQuestId !== 0) {
			hold = false
			completeQuest()
			completeGuildQuest()
			dailycredit()
		}
	})

	mod.hook('S_LOGIN', 'event', () => {
		dailycredit()
	}),

	mod.hook('S_FIELD_EVENT_ON_ENTER', 'raw', () => {  
		entered = true;
		return false;
	});

	mod.hook('C_RETURN_TO_LOBBY', 'raw', () => {  
		entered = false;
	});
	
	mod.hook('S_COMPLETE_EVENT_MATCHING_QUEST', 1, (event) => {
		if (mod.settings.Vanguard) {
			myQuestId = event.id
			if (!hold) completeQuest()
			return false
		}
	})

	mod.hook('S_FIELD_EVENT_PROGRESS_INFO', 1, () => {
		if (mod.settings.Guardian) {
			completeGuardian()
			return false
		}
	})

	mod.hook('S_UPDATE_GUILD_QUEST_STATUS', 1, () => {
		if (mod.settings.GQuest) {
			 completeGuildQuest()
			return false
		}
	})
	
	function completeGuildQuest(event) {
		if (event.targets[0].completed == event.targets[0].total) {
            mod.send('C_REQUEST_FINISH_GUILD_QUEST', 1, {
                quest: event.quest
            })
            if (mod.settings.auto) {
            mod.setTimeout(() => {
                mod.send('C_REQUEST_START_GUILD_QUEST', 1, {
                    questId: event.quest
                })
            }, 3000)
		}
		}
	}

	mod.hook('S_FIELD_POINT_INFO', 2, (event) => {       
		if(entered && event.cleared != clr && event.cleared - 1 > event.claimed) 
		{
			mod.toClient('S_CHAT', 3, {
			channel: 21,
			gm: 1,
			name: 'Guardian Mission',
			message: String(event.cleared + " / 40")
			});
		}
		clr = event.cleared;
	});

	function completeQuest() {
		mod.send('C_COMPLETE_DAILY_EVENT', 1, {
			id: myQuestId
		})
		try {
			setTimeout(() => {
				mod.send('C_COMPLETE_EXTRA_EVENT', 1, {
					type: 0
				})
			}, 500)
			setTimeout(() => {
				mod.send('C_COMPLETE_EXTRA_EVENT', 1, {
					type: 1
				})
			}, 500)
		} catch (e) {
			
		}
		myQuestId = 0
	}

	function completeGuardian() {
		mod.send('C_REQUEST_FIELD_POINT_REWARD', 1, {
		})
		
		mod.setTimeout(() => {
			mod.send('C_REQUEST_ONGOING_FIELD_EVENT_LIST', 1, {
			})
		}, 3000)
}

	function dailycredit() {
		if (mod.settings.Daily) {
			let _ = mod.trySend('C_REQUEST_RECV_DAILY_TOKEN', 1, {});
			 !_ ? mod.log('Unmapped protocol packet \<C_REQUEST_RECV_DAILY_TOKEN\>.') : null;
		  }
	}

function sendMessage(msg) { mod.command.message(msg) }
}
	


