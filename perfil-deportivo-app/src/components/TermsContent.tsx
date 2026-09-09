// Texto completo de Terminos y Condiciones. Se usa tanto en la pagina
// publica (/terminos) como embebido en el gate de aceptacion
// (/aceptar-terminos). Titular: Quick Consultant, CUIT 20-29426860-0,
// Cordoba, Argentina. Contacto/ARCO: quickconsultora@gmail.com.
export default function TermsContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
      <Section title="1. Objeto y aceptación">
        <P>
          1.1. Los presentes Términos y Condiciones (en adelante, los
          &quot;Términos&quot;) regulan el acceso y uso de la aplicación
          Potrero Deportivo (en adelante, la &quot;Plataforma&quot;), operada
          por Quick Consultant (en adelante, &quot;Potrero
          Deportivo&quot;, &quot;nosotros&quot; o &quot;la Empresa&quot;),
          CUIT 20-29426860-0, con domicilio en Córdoba, Córdoba, Argentina.
        </P>
        <P>
          1.2. La Plataforma permite a sus Usuarios registrar, consultar y
          hacer seguimiento del historial deportivo, estadísticas y
          rendimiento de deportistas de distintas disciplinas, incluyendo la
          posibilidad de que un adulto cree y administre el perfil de una
          persona menor de edad a su cargo.
        </P>
        <P>
          1.3. El acceso, la descarga o el uso de la Plataforma implican la
          lectura y aceptación plena, sin reservas, de estos Términos y de la
          Política de Privacidad, que forma parte integrante de este
          documento. Quien no esté de acuerdo con la totalidad de su
          contenido debe abstenerse de utilizar la Plataforma.
        </P>
        <P>
          1.4. Potrero Deportivo podrá modificar estos Términos en cualquier
          momento. Los cambios se notificarán por un medio razonable (aviso
          dentro de la app, correo electrónico o similar) con una antelación
          mínima de 10 días corridos antes de su entrada en vigencia. El uso
          continuado de la Plataforma con posterioridad a dicha entrada en
          vigencia implica la aceptación de los nuevos Términos; quien no
          esté de acuerdo podrá dar de baja su cuenta conforme la Cláusula
          12.
        </P>
      </Section>

      <Section title="2. Definiciones">
        <ul className="flex flex-col gap-2 pl-4">
          <li className="list-disc">
            <strong>Usuario Titular:</strong> persona humana mayor de 18 años
            que crea una cuenta en la Plataforma a su propio nombre y/o en
            representación de un menor a su cargo.
          </li>
          <li className="list-disc">
            <strong>Usuario Menor / Deportista Menor:</strong> persona menor
            de 18 años cuyo perfil es creado y administrado por su Usuario
            Titular (madre, padre, tutor/a u otro representante legal),
            conforme lo previsto en el Código Civil y Comercial de la Nación
            (CCyCN).
          </li>
          <li className="list-disc">
            <strong>Representante Legal:</strong> madre, padre, tutor/a o
            guardador/a que ejerce la responsabilidad parental o
            representación legal del Usuario Menor, en los términos de los
            arts. 100, 101, 638 y concordantes del CCyCN.
          </li>
          <li className="list-disc">
            <strong>Datos Personales:</strong> toda información referida a
            personas humanas identificadas o identificables, en los términos
            del art. 2 de la Ley N.º 25.326.
          </li>
          <li className="list-disc">
            <strong>Datos Sensibles:</strong> datos personales que revelan
            origen étnico, opiniones políticas, convicciones religiosas,
            salud o vida sexual, incluyendo información sobre lesiones,
            condición física o aptitud médica para el deporte (art. 2, Ley
            N.º 25.326).
          </li>
          <li className="list-disc">
            <strong>Contenido:</strong> toda información, texto, imagen,
            video, estadística o dato cargado en la Plataforma por un
            Usuario.
          </li>
        </ul>
      </Section>

      <Section title="3. Registro, capacidad y cuentas de Usuarios Menores">
        <P>
          3.1. Solo pueden crear una cuenta como Usuario Titular personas
          humanas con capacidad legal plena, es decir, mayores de 18 años,
          conforme el art. 25 del CCyCN. La Plataforma no admite el auto
          registro de personas menores de edad.
        </P>
        <P>
          3.2. Perfiles de Usuarios Menores. El Usuario Titular que cree un
          perfil para un Usuario Menor declara bajo su responsabilidad que:
        </P>
        <ul className="flex flex-col gap-2 pl-4">
          <li className="list-disc">
            reviste el carácter de madre, padre, tutor/a o guardador/a legal
            del Usuario Menor, o cuenta con autorización expresa de quien
            ejerce dicha representación;
          </li>
          <li className="list-disc">
            presta, en ese carácter, su consentimiento libre, expreso e
            informado para la creación del perfil y para el tratamiento de
            los Datos Personales —incluidos, en su caso, Datos Sensibles
            vinculados a salud y aptitud física— del Usuario Menor, con la
            finalidad descripta en la Política de Privacidad;
          </li>
          <li className="list-disc">
            es el único responsable de la veracidad, exactitud y
            actualización de los datos cargados respecto del Usuario Menor, y
            de evaluar la conveniencia de compartir dicha información dentro
            de la Plataforma;
          </li>
          <li className="list-disc">
            podrá ejercer en cualquier momento, en representación del Usuario
            Menor, los derechos de acceso, rectificación, actualización y
            supresión de datos previstos en la Cláusula 7, así como solicitar
            la baja del perfil.
          </li>
        </ul>
        <P>
          3.3. Potrero Deportivo podrá solicitar, en cualquier momento,
          documentación razonable que acredite el vínculo o la
          representación legal invocada en el punto 3.2, y podrá suspender o
          dar de baja el perfil ante la falta de acreditación o ante indicios
          de uso indebido.
        </P>
        <P>
          3.4. Conforme el principio de autonomía progresiva (art. 26
          CCyCN), a partir de cierta edad el adolescente puede tener
          intervención en decisiones sobre su propio cuerpo y datos
          vinculados a su salud. Si la Plataforma está destinada a
          adolescentes (13 a 17 años) con cierto grado de interacción directa
          (no solo un perfil administrado íntegramente por el adulto),
          conviene revisar con un profesional si corresponde sumar un
          mecanismo de información/asentimiento adaptado a la edad del
          Usuario Menor, además del consentimiento del Representante Legal.
        </P>
        <P>
          3.5. La cuenta es personal e intransferible. El Usuario Titular es
          responsable de mantener la confidencialidad de sus credenciales de
          acceso y de toda actividad realizada desde su cuenta, incluida la
          que corresponda a los perfiles de Usuarios Menores a su cargo.
        </P>
      </Section>

      <Section title="4. Datos personales que se recopilan y finalidad">
        <P>
          4.1. La Plataforma recopila, entre otros: (i) datos identificatorios
          del Usuario Titular y del Usuario Menor (nombre, apellido, fecha de
          nacimiento, género, foto de perfil, datos de contacto); (ii) datos
          deportivos (disciplina, club, categoría, posición, estadísticas de
          rendimiento, historial de participación); (iii) eventualmente,
          Datos Sensibles vinculados a salud deportiva (lesiones, aptitud
          física, apto médico); y (iv) datos técnicos de uso de la app
          (dispositivo, IP, registros de actividad).
        </P>
        <P>
          4.2. Dichos datos se utilizan para: prestar el servicio de
          seguimiento deportivo, generar estadísticas e historial, permitir
          la comunicación dentro de la Plataforma, mejorar el producto y,
          cuando exista consentimiento específico, fines de comunicación
          comercial.
        </P>
        <P>
          4.3. Datos Sensibles. Conforme el art. 7 de la Ley N.º 25.326, los
          datos sobre salud o condición física solo se recabarán con el
          consentimiento previo, libre, expreso, informado y por escrito
          (incluido el formato electrónico verificable) del Representante
          Legal, y se utilizarán exclusivamente para las finalidades
          informadas, con medidas de seguridad reforzadas.
        </P>
        <P>
          4.4. El detalle completo del tratamiento de datos —bases legales,
          plazos de conservación, cesiones a terceros, medidas de seguridad y
          ejercicio de derechos— se encuentra en la Política de Privacidad,
          que el Usuario Titular declara haber leído y aceptado de forma
          previa e independiente a estos Términos.
        </P>
      </Section>

      <Section title="5. Marco legal de protección de datos personales">
        <P>
          5.1. El tratamiento de Datos Personales realizado por Potrero
          Deportivo se rige por la Ley N.º 25.326 de Protección de los Datos
          Personales, su Decreto Reglamentario N.º 1558/2001, y las
          disposiciones y resoluciones de la Agencia de Acceso a la
          Información Pública (AAIP), autoridad de control en la materia,
          sin perjuicio de la normativa que en el futuro la modifique,
          complemente o sustituya.
        </P>
      </Section>

      <Section title="6. Uso de imágenes y contenido de Usuarios Menores">
        <P>
          6.1. El Representante Legal que suba fotografías, videos u otro
          contenido audiovisual que incluya a un Usuario Menor otorga su
          consentimiento expreso para dicho uso dentro de la Plataforma, en
          los términos del derecho a la imagen reconocido por el art. 53 del
          CCyCN, y garantiza contar con la autorización de todo tercero que
          eventualmente aparezca en dicho contenido.
        </P>
        <P>
          6.2. El Representante Legal podrá solicitar en cualquier momento la
          baja de imágenes o contenido del Usuario Menor, sin necesidad de
          expresar causa.
        </P>
        <P>
          6.3. Queda prohibido subir contenido de terceros menores de edad
          sin la autorización de su Representante Legal.
        </P>
      </Section>

      <Section title="7. Derechos del titular de los datos (ARCO)">
        <P>
          7.1. El Usuario Titular y, en representación del Usuario Menor, su
          Representante Legal, podrán ejercer en cualquier momento y de forma
          gratuita los derechos de acceso, rectificación, actualización,
          supresión y oposición (&quot;derechos ARCO&quot;) sobre los Datos
          Personales tratados por la Plataforma, conforme los arts. 14 a 16
          de la Ley N.º 25.326.
        </P>
        <P>
          7.2. Dichos derechos podrán ejercerse enviando una solicitud a
          quickconsultora@gmail.com, acreditando
          identidad y, en su caso, representación legal. Potrero Deportivo
          responderá dentro de los plazos legales aplicables.
        </P>
        <P>
          7.3. LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter
          de Órgano de Control de la Ley N.º 25.326, tiene la atribución de
          atender las denuncias y reclamos que interpongan quienes resulten
          afectados en sus derechos por incumplimiento de las normas vigentes
          en materia de protección de datos personales.
        </P>
      </Section>

      <Section title="8. Responsabilidad del Usuario">
        <P>
          8.1. El Usuario Titular es el único y exclusivo responsable por:
          (i) la veracidad, exactitud, vigencia y legalidad de los datos que
          cargue en la Plataforma, tanto propios como del Usuario Menor a su
          cargo; (ii) contar con la representación legal y el consentimiento
          necesarios para registrar y tratar los datos del Usuario Menor;
          (iii) el uso que haga de la Plataforma y de la información en ella
          disponible; (iv) la custodia de sus credenciales de acceso; y (v)
          cualquier daño derivado del incumplimiento de estos Términos o de
          la normativa aplicable.
        </P>
        <P>
          8.2. El Usuario Titular se compromete a mantener indemne a Potrero
          Deportivo, sus socios, directivos, empleados y colaboradores
          frente a cualquier reclamo, sanción, daño, pérdida o gasto
          (incluidos honorarios legales razonables) que se origine en: (i)
          datos falsos, inexactos o cargados sin la debida autorización; (ii)
          la falta de representación legal invocada respecto de un Usuario
          Menor; (iii) el incumplimiento de estos Términos o de la ley
          aplicable por parte del Usuario; o (iv) el uso indebido de la
          Plataforma.
        </P>
        <P>
          8.3. Potrero Deportivo es una herramienta de registro y seguimiento
          de información deportiva; no brinda asesoramiento médico, no
          evalúa aptitud física ni sustituye el control de un profesional de
          la salud. Toda decisión sobre la práctica deportiva de un Usuario
          Menor, incluida la evaluación de su aptitud física, es de exclusiva
          responsabilidad de su Representante Legal y de los profesionales de
          la salud que correspondan.
        </P>
      </Section>

      <Section title="9. Limitación de responsabilidad de la Plataforma">
        <P>
          9.1. La Plataforma se provee &quot;tal cual&quot; (&quot;as
          is&quot;) y &quot;según disponibilidad&quot;. Potrero Deportivo no
          garantiza que el servicio sea ininterrumpido, libre de errores o
          esté disponible en todo momento.
        </P>
        <P>
          9.2. En la máxima medida permitida por la legislación argentina,
          Potrero Deportivo no será responsable por daños indirectos,
          incidentales, lucro cesante o pérdida de datos derivados del uso o
          la imposibilidad de uso de la Plataforma, salvo que dichos daños
          sean consecuencia directa de dolo o culpa grave de la Empresa.
        </P>
        <P>
          9.3. Potrero Deportivo no interviene en, ni es responsable por, las
          decisiones deportivas, médicas o de entrenamiento que adopten los
          Usuarios o sus Representantes Legales en base a la información
          registrada en la Plataforma.
        </P>
      </Section>

      <Section title="10. Propiedad intelectual">
        <P>
          10.1. Todos los derechos de propiedad intelectual sobre la
          Plataforma (software, marca, diseño, base de datos, entre otros)
          pertenecen a Potrero Deportivo o a sus licenciantes. El Usuario
          recibe una licencia de uso personal, no exclusiva, no transferible
          y revocable, limitada al uso previsto de la app.
        </P>
        <P>
          10.2. El Contenido cargado por los Usuarios permanece de su
          titularidad; no obstante, al subirlo otorgan a Potrero Deportivo
          una licencia limitada para almacenarlo, procesarlo y mostrarlo
          dentro de la Plataforma con el único fin de prestar el servicio.
        </P>
      </Section>

      <Section title="11. Conductas prohibidas">
        <P>
          Se prohíbe: (i) cargar datos de terceros sin autorización; (ii)
          suplantar la identidad de otra persona; (iii) crear perfiles de
          Usuarios Menores sin la representación legal correspondiente; (iv)
          utilizar la Plataforma con fines ilícitos, difamatorios o
          contrarios a la normativa de protección de niñas, niños y
          adolescentes (Ley N.º 26.061); (v) intentar vulnerar la seguridad
          del sistema.
        </P>
      </Section>

      <Section title="12. Suspensión, baja y duración">
        <P>
          12.1. El Usuario Titular podrá dar de baja su cuenta y la de los
          Usuarios Menores a su cargo en cualquier momento, mediante la
          funcionalidad de la app o solicitud al correo de contacto.
        </P>
        <P>
          12.2. Potrero Deportivo podrá suspender o cancelar una cuenta, con
          aviso previo cuando sea razonablemente posible, ante el
          incumplimiento de estos Términos, la falta de acreditación de
          representación legal requerida, o el uso indebido de la
          Plataforma.
        </P>
      </Section>

      <Section title="13. Legislación aplicable y jurisdicción">
        <P>13.1. Estos Términos se rigen por las leyes de la República Argentina.</P>
        <P>
          13.2. Para cualquier controversia derivada de estos Términos, las
          partes se someten a la jurisdicción de los Tribunales Ordinarios de
          la Ciudad de Córdoba, Provincia de Córdoba, con renuncia a
          cualquier otro fuero o jurisdicción que pudiera corresponder.
        </P>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
