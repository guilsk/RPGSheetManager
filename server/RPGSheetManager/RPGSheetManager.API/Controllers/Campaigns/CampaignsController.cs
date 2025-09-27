using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Campaigns;
using RPGSheetManager.Domain.Campaigns;

namespace RPGSheetManager.API.Controllers.Campaigns {
    [ApiController]
    [Route("api/[controller]")]
    public class CampaignsController : ControllerBase {
        private readonly CampaignService _service;

        public CampaignsController(CampaignService service) {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll() {
            var campaigns = await _service.GetAllAsync();
            return Ok(campaigns);
        }

        [HttpGet("master/{masterId}")]
        public async Task<IActionResult> GetByMasterId(string masterId) {
            var campaigns = await _service.GetByMasterIdAsync(masterId);
            return Ok(campaigns);
        }

        [HttpGet("player/{playerId}")]
        public async Task<IActionResult> GetByPlayerId(string playerId) {
            var campaigns = await _service.GetByPlayerIdAsync(playerId);
            return Ok(campaigns);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id) {
            var campaign = await _service.GetByIdAsync(id);
            return campaign is null ? NotFound() : Ok(campaign);
        }

        [HttpPost]
        public async Task<IActionResult> Create(Campaign campaign) {
            var created = await _service.AddAsync(campaign);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, Campaign campaign) {
            if (id != campaign.Id)
                return BadRequest();

            await _service.UpdateAsync(id, campaign);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id) {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("{campaignId}/characters")]
        public async Task<IActionResult> AddCharacter(string campaignId, CampaignCharacter character) {
            await _service.AddCharacterAsync(campaignId, character);
            return Ok();
        }

        [HttpPut("{campaignId}/characters/{characterId}/data")]
        public async Task<IActionResult> UpdateCharacterData(string campaignId, string characterId, List<DynamicField> data) {
            await _service.UpdateCharacterDataAsync(campaignId, characterId, data);
            return NoContent();
        }

        [HttpPost("{campaignId}/roll")]
        public async Task<IActionResult> SaveRoll(string campaignId, DiceRoll roll) {
            await _service.SaveRollHistoryAsync(campaignId, roll);
            return Ok();
        }

        [HttpPost("{campaignId}/start")]
        public async Task<IActionResult> StartSession(string campaignId) {
            await _service.StartSessionAsync(campaignId);
            return Ok();
        }

        [HttpPost("{campaignId}/end")]
        public async Task<IActionResult> EndSession(string campaignId) {
            await _service.EndSessionAsync(campaignId);
            return Ok();
        }
    }
}
