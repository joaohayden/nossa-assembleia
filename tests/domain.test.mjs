import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleProposals, validateProposal, applyVote, isNewProposal, validateResident } from '../lib/domain.mjs';
const items = [
 { id:'old', title:'Iluminação', description:'Garagem', category:'Segurança', rank:3, count:3, status:'open', createdAt:'2026-01-01', mine:false },
 { id:'new', title:'Jardim', description:'Flores', category:'Áreas comuns', rank:2, count:2, status:'assembly', createdAt:'2026-02-01', mine:true },
 { id:'hidden', title:'Arquivo', description:'Antigo', category:'Segurança', rank:9, count:9, status:'archived', createdAt:'2026-03-01', mine:false }
];
test('residents never see archived proposals; admin can inspect them', () => { assert.deepEqual(visibleProposals(items).map(p=>p.id),['old','new']); assert.equal(visibleProposals(items,{admin:true})[0].id,'hidden'); });
test('votes reorder immediately; switching direction replaces the previous vote', () => {
 let p={...items[1],count:3,down:0,myVote:0,rank:3};
 p=applyVote(p,1); assert.equal(visibleProposals([items[0],p])[0].id,'new');
 p=applyVote(p,-1); assert.equal(p.count,3); assert.equal(p.down,1); assert.equal(p.rank,2);
 p=applyVote(p,-1); assert.equal(p.down,0); assert.equal(p.myVote,0);
});
test('recent sort, assembly and own filters compose with categories', () => { assert.equal(visibleProposals(items,{filter:'recent'})[0].id,'new'); assert.deepEqual(visibleProposals(items,{filter:'assembly', category:'Segurança'}),[]); assert.equal(visibleProposals(items,{filter:'mine'})[0].id,'new'); });
test('search is accent-insensitive and does not mutate source', () => { const before=JSON.stringify(items); assert.equal(visibleProposals(items,{query:' ILUMINACAO '})[0].id,'old'); assert.equal(JSON.stringify(items),before); });
test('empty and oversized submissions are rejected', () => { assert.ok(validateProposal('        ','long enough description')); assert.ok(validateProposal('Título válido','curto')); assert.ok(validateProposal('a'.repeat(101),'long enough description')); assert.ok(validateProposal('Título válido','a'.repeat(1501))); assert.equal(validateProposal('Iluminação na garagem','Melhorar a iluminação do caminho de casa.'),null); });

test('new badge expires at exactly one hour, excluding invalid and future dates', () => {
 const created='2026-10-21T12:00:00Z'; const start=Date.parse(created);
 assert.equal(isNewProposal(created,start),true);
 assert.equal(isNewProposal(created,start+3599999),true);
 assert.equal(isNewProposal(created,start+3600000),false);
 assert.equal(isNewProposal(created,start-1),false);
 assert.equal(isNewProposal('invalid',start),false);
});

test('resident name, apartment and block are mandatory, including whitespace rejection', () => {
 assert.ok(validateResident(' ','204','A'));
 assert.ok(validateResident('Ana Silva',' ','A'));
 assert.ok(validateResident('Ana Silva','204',' '));
 assert.equal(validateResident('Ana Silva','204','A'),null);
});
