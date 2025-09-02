using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Characters {
    public class Character {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        [BsonElement("systemId")]
        public required string SystemId { get; set; }
        [BsonElement("userId")]
        public required string UserId { get; set; }
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; }
        [BsonElement("name")]
        public required string Name { get; set; }
        [BsonElement("data")]
        public required List<CharacterData> Data { get; set; }
    }

    public class CharacterData {
        [BsonElement("name")]
        public required string Name { get; set; }
        [BsonElement("value")]
        public string? Value { get; set; }
        [BsonElement("rollable")]
        public RollConfig? Rollable { get; set; }
        [BsonElement("expression")]
        public string? Expression { get; set; }
        [BsonElement("editable")]
        public bool Editable { get; set; }
        [BsonElement("edited")]
        public bool Edited { get; set; }
        [BsonElement("sessionEditable")]
        public bool SessionEditable { get; set; }
        [BsonElement("visible")]
        public bool Visible { get; set; }
        [BsonElement("category")]
        public string? Category { get; set; }
        [BsonElement("component")]
        public required string Component { get; set; }
        [BsonElement("order")]
        public int? Order { get; set; }
        [BsonElement("options")]
        public string[]? Options { get; set; }
    }

    public class RollConfig {
        [BsonElement("enabled")]
        public bool Enabled { get; set; }
        [BsonElement("formula")]
        public string? Formula { get; set; }
    }
}
