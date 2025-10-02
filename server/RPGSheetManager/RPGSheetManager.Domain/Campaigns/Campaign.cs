using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class Campaign {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        [BsonElement("title")]
        public required string Title { get; set; }
        [BsonElement("description")]
        public string? Description { get; set; }
        [BsonElement("systemId")]
        public required string SystemId { get; set; }
        [BsonElement("masterId")]
        public required string MasterId { get; set; }
        [BsonElement("playerIds")]
        public List<string>? PlayerIds { get; set; } = new();
        [BsonElement("invitedPlayerIds")]
        public List<string>? InvitedPlayerIds { get; set; } = new();
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [BsonElement("activeSession")]
        public bool ActiveSession { get; set; } = false;
        [BsonElement("characters")]
        public List<CampaignCharacter>? Characters { get; set; } = new();
        [BsonElement("diceHistory")]
        public List<DiceRoll>? DiceHistory { get; set; } = new();
    }
}
