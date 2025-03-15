import os
from openai import AsyncOpenAI
import dotenv
from app.schemas.profiles import Profile

dotenv.load_dotenv()

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def generate_embedding(text_or_profile):
    """
    Generate an embedding for the given text or Profile object using OpenAI
    """
    # If input is a Profile object, convert it to a string representation
    if isinstance(text_or_profile, Profile):
        profile = text_or_profile
        # Create a string representation of the profile
        profile_text = f"""
        Name: {profile.full_name}
        Headline: {profile.headline or ''}
        Industry: {profile.industry or ''}
        Location: {profile.location or ''}
        Summary: {profile.summary or ''}
        
        """
        # Extract additional useful information from raw_profile_data if available
        if profile.raw_profile_data:
            # Add experience information
            if 'experiences' in profile.raw_profile_data:
                profile_text += "\nExperience:"
                for exp in profile.raw_profile_data.get('experiences', [])[:5]:  # Limit to 5 most recent
                    company = exp.get('company', '')
                    title = exp.get('title', '')
                    description = exp.get('description', '')
                    # Add safeguard for None description
                    desc_snippet = description[:100] + "..." if description else ""
                    profile_text += f"\n- {title} at {company}: {desc_snippet}"
            
            # Add education information
            if 'education' in profile.raw_profile_data:
                profile_text += "\nEducation:"
                for edu in profile.raw_profile_data.get('education', []):
                    school = edu.get('school', '')
                    degree = edu.get('degree_name', '')
                    profile_text += f"\n- {degree} from {school}"
            
            # Add skills information
            if 'skills' in profile.raw_profile_data:
                profile_text += "\nSkills:"
                skills = profile.raw_profile_data.get('skills', [])[:10]  # Limit to top 10 skills
                skill_names = [skill.get('name', '') for skill in skills if skill.get('name')]
                if skill_names:
                    profile_text += f"\n- {', '.join(skill_names)}"
        
        input_text = profile_text.strip()
        
    else:
        input_text = text_or_profile
    
    response = await client.embeddings.create(
        model="text-embedding-ada-002",
        input=input_text
    )
    
    return response.data[0].embedding
