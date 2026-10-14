import Prep from './prep';
import { getChatGPTUser } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Page() { return <Prep signedIn={!!await getChatGPTUser()}/>; }
