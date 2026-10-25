import {test} from 'node:test';
import assert from 'node:assert/strict';
import {targetPickerItems,filterTargetPickerItems,targetPickerHtml} from '../js/ui/aggregation-target-picker.js';
const games=[{id:'old',date:'2025-05-01',opponent:'Glanz',tournament:'大会A'},{id:'new',date:'2026-10-25',opponent:'ABC',tournament:'大会B'},{id:'mid',date:'2026-09-01',opponent:'Glanz',tournament:'大会A'}];
test('newest first without changing source order',()=>{assert.deepEqual(targetPickerItems(games,'game').map(x=>x.id),['new','mid','old']);assert.equal(games[0].id,'old')});
test('search matches normalized opponent, tournament and date with month intersection',()=>{const items=targetPickerItems(games,'game');assert.deepEqual(filterTargetPickerItems(items,'ｇｌａｎｚ 大会A','2026-09').map(x=>x.id),['mid']);assert.equal(filterTargetPickerItems(items,'Glanz','2026-10').length,0);assert.equal(filterTargetPickerItems(items).length,3)});
test('tournaments remain one aggregate across all dates',()=>{const items=targetPickerItems(games,'tournament');assert.equal(items.length,2);assert.equal(filterTargetPickerItems(items,'大会A','2025-05')[0].count,2);assert.equal(filterTargetPickerItems(items,'大会A','2026-09')[0].id,'大会A')});
test('preserves selected id and safely renders labels',()=>{const html=targetPickerHtml('stat',[{id:'"<x>',date:'2026-10-25',opponent:'<script>',tournament:'A&B'}],'game','"<x>');assert.ok(html.includes('value="&quot;&lt;x&gt;" selected'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('id="statTarget"'));assert.equal(targetPickerItems([],'game').length,0)});
