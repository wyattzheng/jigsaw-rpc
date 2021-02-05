import net from "net";
import dns from "dns";

export async function DnsResolve4(hostname:string) : Promise<string>{
    if(net.isIP(hostname)){
        return hostname;
    }else{ //if dst_address is a domain, resolve it firstly

        let resolved = await dns.promises.lookup(hostname,4);
        return resolved.address;
    }
}
