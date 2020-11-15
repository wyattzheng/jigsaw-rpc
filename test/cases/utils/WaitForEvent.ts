export default function waitForEvent(obj:any,event_name:string){
    return new Promise((resolve)=>{
        obj.once(event_name,(data:any)=>{
            resolve(data);
        });
    })
};