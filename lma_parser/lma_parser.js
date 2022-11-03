$('#gen_data').click(function () {
	 let lmaSrc = $( '<div></div>' );
		lmaSrc.html($("#lma_src").val());

	 
	 let discoveryData = '{\\"scenes\\":[';
	 let powerctrlData = 'array(';
	 let scenes = lmaSrc.find('#scenes');
	 
	 scenes.find('.sbElement').each(function (y) {
		let sbElement = $(this);
		let onReq = sbElement.find('div').eq(1).find('input').eq(0).attr('onclick');
		if (typeof onReq !== 'undefined'){
			discoveryData+='{\\"id\\":\\"'+sbElement.attr('id')+'\\",\\"name\\":\\"'+sbElement.find('div').eq(0).text()+'\\"},';
			powerctrlData+='"'+sbElement.attr('id')+'"=>["'+onReq.replace("request('idx,",'scene=').replace("')",'')+'"],';
		}
	 });
  if(discoveryData.endsWith(',')){
		discoveryData = discoveryData.substring(0, discoveryData.length - 1);
	  }
	  
	 discoveryData+='],\\"rooms\\":[';
	 
	 let rooms = lmaSrc.find('.bigBlock');
	 
	 rooms.each(function (y) {
		let bigBlockElement = $(this);
		let id = bigBlockElement.attr('id');
		if(id.startsWith('z')){
			 if( bigBlockElement.find('.sbElement').length )   
			{
				
				discoveryData+='{\\"name\\":\\"'+bigBlockElement.find('.bbName').text()+'\\",\\"devs\\":[';
				
				bigBlockElement.find('.sbElement').each(function (y) {
					let sbElement = $(this);
					let name = sbElement.find('div').eq(0).text();
					discoveryData+='{\\"id\\":\\"'+sbElement.attr('id')+'\\",\\"name\\":\\"'+name+'\\"';
					if(name.toUpperCase().includes('BLINDS')||name.toUpperCase().includes('PARTITION')||name.toUpperCase().includes('CURTAIN')){
						discoveryData+=',\\"cat\\":\\"INTERIOR_BLIND\\"},';
					} else if(name.toUpperCase().includes('LIGHT')||name.toUpperCase().includes('SPOT')){
						discoveryData+=',\\"cat\\":\\"LIGHT\\"},';
					} else {
						discoveryData+=',\\"cat\\":\\"SWITCH\\"},';
					}
					powerctrlData+='"'+sbElement.attr('id')+'"=>["'+sbElement.find('div').eq(1).find('input').eq(0).attr('onclick').replace("request('",'cmd=').replace("')",'');
					let offReq = sbElement.find('div').eq(1).find('input').eq(1).attr('onclick');
					if (typeof offReq !== 'undefined'){
						powerctrlData+='","'+offReq.replace("request('",'cmd=').replace("')",'');
					}
					
					powerctrlData+='"],';
			  });
				
				if(discoveryData.endsWith(',')){
					discoveryData = discoveryData.substring(0, discoveryData.length - 1);
				  }
				  discoveryData+=']},';
			}
			
		}
	
	
   
  });

	 
	 
	if(discoveryData.endsWith(',')){
		discoveryData = discoveryData.substring(0, discoveryData.length - 1);
	  }
	  if(powerctrlData.endsWith(',')){
		powerctrlData = powerctrlData.substring(0, powerctrlData.length - 1);
	  }
	  discoveryData+=']}';
	  powerctrlData+=');';
	 $("#discovery").val(discoveryData)
	  $("#powerctrl").val(powerctrlData)
	 
    });
