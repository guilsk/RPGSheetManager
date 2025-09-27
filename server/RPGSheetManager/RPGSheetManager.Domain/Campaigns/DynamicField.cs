using MongoDB.Bson.Serialization.Attributes;

namespace RPGSheetManager.Domain.Campaigns {
    public class DynamicField {
        [BsonElement("name")]
        public required string Name { get; set; }
        [BsonElement("value")]
        public required string Value { get; set; }
        [BsonElement("edited")]
        public bool Edited { get; set; } = false;
    }
}
