using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using RPGSheetManager.Domain.Characters;

namespace RPGSheetManager.Domain.Systems {
    public class RPGSystem {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        [BsonElement("name")]
        public required string Name { get; set; }
        [BsonElement("description")]
        public required string Description { get; set; }
        [BsonElement("ownerId")]
        public string OwnerId { get; set; } = null!;
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [BsonElement("template")]
        public List<CharacterData> Template { get; set; } = new List<CharacterData>();
        [BsonElement("categoryOrder")]
        public string[]? CategoryOrder { get; set; }
        [BsonElement("obsolete")]
        public bool Obsolete { get; set; } = false;
    }
}
