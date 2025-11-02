using Microsoft.AspNetCore.Mvc;
using RPGSheetManager.Application.Services.Campaigns;
using RPGSheetManager.Domain.Campaigns;
using System.Text.Json;

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

        [HttpPut("{campaignId}/characters/{characterId}/session-data")]
        public async Task<IActionResult> UpdateCharacterSessionData(string campaignId, string characterId, [FromQuery] string playerId, [FromBody] List<DynamicField> data) {
            if (data == null) {
                return BadRequest("Dados não fornecidos.");
            }

            var success = await _service.UpdateCharacterDataWithValidationAsync(campaignId, characterId, playerId, data);
            return success ? NoContent() : BadRequest("Não foi possível atualizar os dados. Verifique se você é o dono do personagem.");
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

        [HttpGet("invites/{playerId}")]
        public async Task<IActionResult> GetInvitesByPlayerId(string playerId) {
            var campaigns = await _service.GetInvitesByPlayerIdAsync(playerId);
            return Ok(campaigns);
        }

        [HttpPost("{campaignId}/invites/{playerId}/accept")]
        public async Task<IActionResult> AcceptInvite(string campaignId, string playerId) {
            var success = await _service.AcceptInviteAsync(campaignId, playerId);
            return success ? Ok() : BadRequest("Convite não encontrado ou já aceito");
        }

        [HttpPost("{campaignId}/invites/{playerId}/decline")]
        public async Task<IActionResult> DeclineInvite(string campaignId, string playerId) {
            var success = await _service.DeclineInviteAsync(campaignId, playerId);
            return success ? Ok() : BadRequest("Convite não encontrado");
        }

        [HttpPost("{campaignId}/characters/{characterId}/associate")]
        public async Task<IActionResult> AssociateCharacter(string campaignId, string characterId, [FromQuery] string playerId) {
            var success = await _service.AssociateCharacterAsync(campaignId, characterId, playerId);
            return success ? Ok() : BadRequest("Não foi possível associar o personagem");
        }

        [HttpDelete("{campaignId}/characters/{characterId}")]
        public async Task<IActionResult> DisassociateCharacter(string campaignId, string characterId, [FromQuery] string playerId) {
            var success = await _service.DisassociateCharacterAsync(campaignId, characterId, playerId);
            return success ? Ok() : BadRequest("Não foi possível desassociar o personagem");
        }

        [HttpGet("{campaignId}/characters/{characterId}/campaign-data")]
        public async Task<IActionResult> GetCampaignCharacterData(string campaignId, string characterId) {
            var campaignCharacter = await _service.GetCampaignCharacterAsync(campaignId, characterId);
            return campaignCharacter is null ? NotFound() : Ok(campaignCharacter);
        }

        [HttpDelete("{campaignId}/players/{playerId}")]
        public async Task<IActionResult> RemovePlayerFromCampaign(string campaignId, string playerId) {
            var success = await _service.RemovePlayerFromCampaignAsync(campaignId, playerId);
            return success ? Ok() : BadRequest("Não foi possível remover o jogador da campanha");
        }

        [HttpPost("initialize-example")]
        public async Task<IActionResult> InitializeExampleCampaign() {
            var campaignId = await _service.InitializeExampleCampaignAsync();
            return Ok(new { campaignId });
        }

        [HttpPost("invite-to-example")]
        public async Task<IActionResult> InviteToExampleCampaign([FromQuery] string playerId) {
            var success = await _service.InviteToExampleCampaignAsync(playerId);
            return success ? Ok() : BadRequest("Não foi possível enviar convite para campanha de exemplo");
        }
    }
}
