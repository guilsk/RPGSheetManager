using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class Campaign {
        [BsonId]
        [BsonRepresentation(BsonType.String)]
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        [BsonRepresentation(BsonType.String)]
        public Guid SystemId { get; set; }
        [BsonRepresentation(BsonType.String)]
        public Guid MasterId { get; set; }
        [BsonRepresentation(BsonType.String)]
        public List<Guid> PlayerIds { get; set; } = new();
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool ActiveSession { get; set; } = false;
        public List<CampaignCharacter> Characters { get; set; } = new();
        public List<ChatMessage> ChatMessages { get; set; } = new();
        public List<DiceRoll> DiceHistory { get; set; } = new();
    }
}
