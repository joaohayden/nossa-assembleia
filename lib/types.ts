export type Status = 'open' | 'assembly' | 'done' | 'archived';
export type Proposal = { id: string; title: string; description: string; category: string; status: Status; author: string; apartment?: string; block?: string; createdAt: string; count: number; down: number; myVote: number; rank: number; supported: boolean; mine: boolean; note: string };
export type Profile = { id: string; name: string; unit: string; approved: boolean; role: 'resident' | 'admin' };
