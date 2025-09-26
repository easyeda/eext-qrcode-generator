// 工具函数

function CreateObj()
{
	
	const edaObj = eda.pcb_PrimitiveLine.create("H", EPCB_LayerId.TOP_SILKSCREEN,0,0,0,5,10,false);
	console.log(edaObj.primitiveId);
}